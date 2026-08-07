#!/usr/bin/env python3
"""Generate reusable hair-compositing layers for reviewed portraits.

The pipeline intentionally runs offline. It combines the reviewed SAM garment
and coarse-hair masks with Google's MediaPipe HairSegmenter, builds a trimap,
uses ViTMatte for strand alpha, and uses PyMatting to recover foreground and
underlay colors. No model runs in the browser or when a color control moves.
"""

from __future__ import annotations

import argparse
import colorsys
import hashlib
import json
import os
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import mediapipe as mp
import numpy as np
import torch
from PIL import Image
from pymatting import estimate_foreground_ml
from scipy.cluster.vq import kmeans2
from scipy.ndimage import (
    binary_dilation,
    binary_erosion,
    distance_transform_edt,
    label,
)
from transformers import VitMatteForImageMatting, VitMatteImageProcessor


REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_ROOT = REPOSITORY_ROOT / "public"
REGISTRY_PATH = REPOSITORY_ROOT / "src/data/avatar-masks.json"

HAIR_SEGMENTER_URL = (
    "https://storage.googleapis.com/mediapipe-models/image_segmenter/"
    "hair_segmenter/float32/latest/hair_segmenter.tflite"
)
HAIR_SEGMENTER_SHA256 = "2628cf3ce5f695f604cbea2841e00befcaa3624bf80caf3664bef2656d59bf84"
VITMATTE_MODEL = "hustvl/vitmatte-small-composition-1k"
VITMATTE_REVISION = "6a58ad7646403c1df626fbd746900aec7361ea1d"

LAYER_FILES = {
    "region": "hair-region.png",
    "trimap": "hair-trimap.png",
    "matte": "hair-matte.png",
    "foreground": "hair-foreground.png",
    "underlay": "hair-underlay.png",
    "underlayKind": "hair-underlay-kind.png",
    "shirtRefined": "shirt-refined.png",
}

PARAMETERS = {
    "hairCoreProbability": 0.72,
    "hairOuterProbability": 0.12,
    "semanticSupportDilationPixels": 24,
    "coreErosionPixels": 8,
    "outerDilationPixels": 12,
    "paletteClusters": 12,
    "paletteHairMaxYRatio": 0.58,
    "paletteFallbackMaskThreshold": 0.75,
    "minimumPaletteSamples": 500,
    "garmentAffinityMargin": 0.04,
    "garmentAmbiguityMargin": -0.02,
    "garmentPaletteDistance": 0.16,
    "garmentEdgePaletteDistance": 0.24,
    "garmentEdgeDilationPixels": 3,
    "garmentDistancePixels": 180,
    "conflictDilationPixels": 5,
    "conflictSupportDilationPixels": 16,
    "storageHaloPixels": 8,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id", help="Generate one registered avatar ID.")
    parser.add_argument("--prefix", help="Generate registered avatar IDs with this prefix.")
    parser.add_argument(
        "--all",
        action="store_true",
        help="Generate every registered avatar with a reviewed coarse hair layer.",
    )
    parser.add_argument("--force", action="store_true", help="Replace current generated layers.")
    parser.add_argument(
        "--mediapipe-model",
        type=Path,
        help="Use an existing HairSegmenter .tflite instead of the verified cache copy.",
    )
    return parser.parse_args()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def save_image(path: Path, array: np.ndarray, mode: str) -> None:
    temporary = path.with_suffix(f"{path.suffix}.tmp")
    image = Image.fromarray(array)
    if image.mode != mode:
        image = image.convert(mode)
    image.save(temporary, format="PNG", optimize=True)
    temporary.replace(path)


def layer_metadata(path: Path, mode: str) -> dict[str, object]:
    with Image.open(path) as image:
        width, height = image.size
    data = path.read_bytes()
    return {
        "file": path.name,
        "mode": mode,
        "width": width,
        "height": height,
        "bytes": len(data),
        "sha256": sha256_bytes(data),
    }


def verified_hair_segmenter(requested_path: Path | None) -> Path:
    if requested_path:
        path = requested_path.expanduser().resolve()
        if not path.is_file():
            raise FileNotFoundError(f"MediaPipe model does not exist: {path}")
        actual = sha256_file(path)
        if actual != HAIR_SEGMENTER_SHA256:
            raise RuntimeError(
                f"MediaPipe checkpoint checksum changed: expected {HAIR_SEGMENTER_SHA256}, got {actual}."
            )
        return path

    cache_root = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache"))
    path = cache_root / "palari-art" / "hair_segmenter.tflite"
    if path.is_file() and sha256_file(path) == HAIR_SEGMENTER_SHA256:
        return path

    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    print("Downloading the Apache-2.0 MediaPipe HairSegmenter checkpoint...")
    urllib.request.urlretrieve(HAIR_SEGMENTER_URL, temporary)
    actual = sha256_file(temporary)
    if actual != HAIR_SEGMENTER_SHA256:
        temporary.unlink(missing_ok=True)
        raise RuntimeError(
            f"MediaPipe checkpoint checksum changed: expected {HAIR_SEGMENTER_SHA256}, got {actual}."
        )
    temporary.replace(path)
    return path


def media_pipe_hair_probability(segmenter, source_path: Path) -> np.ndarray:
    result = segmenter.segment(mp.Image.create_from_file(str(source_path)))
    if len(result.confidence_masks) < 2:
        raise RuntimeError("MediaPipe HairSegmenter returned no hair confidence channel.")
    return np.array(result.confidence_masks[1].numpy_view(), copy=True).squeeze()


def keep_supported_components(probability: np.ndarray, semantic_support: np.ndarray) -> np.ndarray:
    components, component_count = label(
        (probability > PARAMETERS["hairOuterProbability"]) & semantic_support
    )
    keep = np.zeros(probability.shape, dtype=bool)
    for component_id in range(1, component_count + 1):
        component = components == component_id
        if component.sum() > 500 and np.any(probability[component] > 0.7):
            keep |= component
    if not keep.any():
        raise RuntimeError("HairSegmenter produced no supported hair component.")
    return keep


def palette_centers(
    source: np.ndarray,
    hair_core: np.ndarray,
    reviewed_hair: np.ndarray,
    garment_seed: np.ndarray,
    garment_top: int,
    seed: int,
) -> tuple[np.ndarray, np.ndarray]:
    height = source.shape[0]
    y_grid = np.indices(hair_core.shape)[0]
    upper_hair = y_grid < height * PARAMETERS["paletteHairMaxYRatio"]
    hair_samples = source[hair_core & upper_hair]
    if len(hair_samples) < PARAMETERS["minimumPaletteSamples"]:
        # Some textured or very light hairstyles receive conservative semantic
        # confidence even though the independently reviewed SAM mask is sound.
        # Fall back to that mask's high-confidence interior, still restricted to
        # the upper portrait so garment pixels cannot enter the hair palette.
        hair_samples = source[
            (reviewed_hair > PARAMETERS["paletteFallbackMaskThreshold"]) & upper_hair
        ]
    garment_samples = source[garment_seed & (y_grid >= garment_top)]
    if (
        len(hair_samples) < PARAMETERS["minimumPaletteSamples"]
        or len(garment_samples) < PARAMETERS["minimumPaletteSamples"]
    ):
        raise RuntimeError("Not enough clean hair or garment samples for adaptive palette fitting.")

    random = np.random.default_rng(seed)
    hair_samples = hair_samples[
        random.choice(len(hair_samples), min(30_000, len(hair_samples)), replace=False)
    ]
    garment_samples = garment_samples[
        random.choice(len(garment_samples), min(30_000, len(garment_samples)), replace=False)
    ]
    cluster_count = PARAMETERS["paletteClusters"]
    hair_centers, _ = kmeans2(hair_samples, cluster_count, minit="++", seed=random)
    garment_centers, _ = kmeans2(garment_samples, cluster_count, minit="++", seed=random)
    return hair_centers, garment_centers


def nearest_palette_distance(source: np.ndarray, centers: np.ndarray) -> np.ndarray:
    flat = source.reshape(-1, 3)
    distances = np.full(len(flat), 99.0, dtype=np.float32)
    for center in centers:
        distances = np.minimum(distances, np.sqrt(np.sum((flat - center) ** 2, axis=1)))
    return distances.reshape(source.shape[:2])


def clean_foreground_colors(
    source: np.ndarray,
    foreground: np.ndarray,
    alpha: np.ndarray,
    search_region: np.ndarray,
    hair_centers: np.ndarray,
    garment_centers: np.ndarray,
) -> np.ndarray:
    """Neutralize source underlayer chroma using an adaptive two-color mixture.

    Every candidate is fitted against all learned hair/garment palette pairs.
    The recovered hair hue/saturation is used only when the fit is strong; its
    original foreground lightness is retained so strand texture is not flattened.
    """

    indexes = np.flatnonzero(search_region & (alpha > 0.08))
    if len(indexes) == 0:
        return foreground
    observed = source.reshape(-1, 3)[indexes]
    best_residual = np.full(len(indexes), 99.0)
    best_alpha = np.ones(len(indexes))
    best_hair = np.zeros((len(indexes), 3))

    for hair_color in hair_centers:
        for garment_color in garment_centers:
            vector = hair_color - garment_color
            denominator = float(vector @ vector)
            if denominator < 0.05:
                continue
            mixture_alpha = np.clip(((observed - garment_color) @ vector) / denominator, 0, 1)
            predicted = garment_color + mixture_alpha[:, None] * vector
            residual = np.sqrt(np.sum((observed - predicted) ** 2, axis=1))
            better = residual < best_residual
            best_residual[better] = residual[better]
            best_alpha[better] = mixture_alpha[better]
            best_hair[better] = hair_color

    supported = (best_residual < 0.075) & (best_alpha < 0.985)
    selected = indexes[supported]
    if len(selected) == 0:
        return foreground

    flat_foreground = foreground.reshape(-1, 3).copy()
    current = flat_foreground[selected]
    clean = np.empty_like(current)
    for index, (hair_color, foreground_color) in enumerate(zip(best_hair[supported], current)):
        hair_hue, _, hair_saturation = colorsys.rgb_to_hls(*hair_color)
        _, foreground_lightness, _ = colorsys.rgb_to_hls(*foreground_color)
        clean[index] = colorsys.hls_to_rgb(hair_hue, foreground_lightness, hair_saturation)

    confidence = np.clip(1 - best_residual[supported] / 0.075, 0, 1)
    mixture_weight = np.clip(np.sqrt(1 - best_alpha[supported]) * 2.5, 0, 1)
    weight = confidence * mixture_weight
    flat_foreground[selected] = current * (1 - weight[:, None]) + clean * weight[:, None]
    return np.clip(flat_foreground.reshape(source.shape), 0, 1)


def current_layers(metadata: dict, mask_directory: Path, source_hash: str) -> bool:
    record = metadata.get("hairMatting")
    if not record or record.get("sourceSha256") != source_hash:
        return False
    if record.get("parameters") != PARAMETERS:
        return False
    if record.get("models", {}).get("matting", {}).get("revision") != VITMATTE_REVISION:
        return False
    for key, filename in LAYER_FILES.items():
        path = mask_directory / filename
        if not path.is_file() or record.get("layers", {}).get(key, {}).get("sha256") != sha256_file(path):
            return False
    return True


def main() -> None:
    args = parse_args()
    registry = json.loads(REGISTRY_PATH.read_text())
    if args.id:
        avatars = [avatar for avatar in registry["avatars"] if avatar["id"] == args.id]
    elif args.prefix:
        avatars = [avatar for avatar in registry["avatars"] if avatar["id"].startswith(args.prefix)]
    elif args.all:
        avatars = registry["avatars"]
    else:
        avatars = [avatar for avatar in registry["avatars"] if avatar.get("hairPilot")]
    if not avatars:
        raise RuntimeError("No matching registered avatars were found.")
    avatars = [avatar for avatar in avatars if avatar.get("hairMatting", True) is not False]
    if not avatars:
        raise RuntimeError("All matching avatars are explicitly hair-matting exempt.")

    model_path = verified_hair_segmenter(args.mediapipe_model)
    segmenter_options = mp.tasks.vision.ImageSegmenterOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(model_path)),
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        output_confidence_masks=True,
        output_category_mask=False,
    )
    matte_processor = VitMatteImageProcessor.from_pretrained(
        VITMATTE_MODEL,
        revision=VITMATTE_REVISION,
    )
    matte_model = VitMatteForImageMatting.from_pretrained(
        VITMATTE_MODEL,
        revision=VITMATTE_REVISION,
    ).eval()

    with mp.tasks.vision.ImageSegmenter.create_from_options(segmenter_options) as segmenter:
        for position, avatar in enumerate(avatars, start=1):
            avatar_id = avatar["id"]
            source_path = PUBLIC_ROOT / avatar["source"]
            mask_directory = PUBLIC_ROOT / "masks" / avatar_id
            metadata_path = mask_directory / "metadata.json"
            metadata = json.loads(metadata_path.read_text())
            source_hash = sha256_file(source_path)
            hair_layer = metadata.get("hairLayer")
            if hair_layer is None or hair_layer.get("status") != "reviewed":
                raise RuntimeError(f"{avatar_id}: reviewed coarse hair layer is required.")
            hair_path = mask_directory / "hair.png"
            if (
                not hair_path.is_file()
                or hair_layer.get("mask", {}).get("sha256") != sha256_file(hair_path)
            ):
                raise RuntimeError(f"{avatar_id}: coarse hair layer checksum does not match metadata.")
            if not args.force and current_layers(metadata, mask_directory, source_hash):
                print(f"[{position}/{len(avatars)}] {avatar_id}: current hair-matting layers exist; skipping.")
                continue

            print(f"[{position}/{len(avatars)}] {avatar_id}: parsing hair and building trimap...")
            source_image = Image.open(source_path).convert("RGB")
            source = np.asarray(source_image).astype(np.float64) / 255
            height, width = source.shape[:2]
            hair_probability = media_pipe_hair_probability(segmenter, source_path)
            shirt = np.asarray(Image.open(mask_directory / "shirt.png").convert("L")).astype(np.float64) / 255
            coarse_hair = np.asarray(Image.open(mask_directory / "hair.png").convert("L")).astype(np.float64) / 255
            person_matte = np.asarray(Image.open(mask_directory / "matte.png").convert("L")).astype(np.float64) / 255
            if hair_probability.shape != (height, width):
                hair_probability = np.asarray(
                    Image.fromarray(hair_probability.astype(np.float32)).resize(
                        (width, height), Image.Resampling.BILINEAR
                    )
                )

            semantic_support = binary_dilation(
                coarse_hair > PARAMETERS["hairOuterProbability"],
                iterations=PARAMETERS["semanticSupportDilationPixels"],
            )
            supported_components = keep_supported_components(hair_probability, semantic_support)
            hair_core = binary_erosion(
                (hair_probability > PARAMETERS["hairCoreProbability"]) & supported_components,
                iterations=PARAMETERS["coreErosionPixels"],
            )
            hair_outer = binary_dilation(
                supported_components,
                iterations=PARAMETERS["outerDilationPixels"],
            )
            hair_region = (hair_probability > 0.5) & binary_dilation(supported_components, iterations=2)
            garment_seed = shirt > 0.75
            garment_rows = np.where(garment_seed)[0]
            if len(garment_rows) == 0:
                raise RuntimeError(f"{avatar_id}: reviewed garment mask has no strong seed pixels.")
            garment_top = int(garment_rows.min())
            numeric_seed = int(source_hash[:8], 16)
            hair_centers, garment_centers = palette_centers(
                source, hair_core, coarse_hair, garment_seed, garment_top, numeric_seed
            )
            hair_distance = nearest_palette_distance(source, hair_centers)
            garment_distance = nearest_palette_distance(source, garment_centers)
            spatial_distance = distance_transform_edt(~garment_seed)
            y_grid = np.indices((height, width))[0]

            conflict_search = (
                (coarse_hair > 0.5)
                & (y_grid >= garment_top)
                & (spatial_distance < PARAMETERS["garmentDistancePixels"])
            )
            affinity = hair_distance - garment_distance
            conflict_support = binary_dilation(
                coarse_hair > 0.12,
                iterations=PARAMETERS["conflictSupportDilationPixels"],
            )
            adaptive_garment = (
                (y_grid >= garment_top)
                & (person_matte >= 0.5)
                & (spatial_distance < PARAMETERS["garmentDistancePixels"])
                & (garment_distance < PARAMETERS["garmentPaletteDistance"])
                & (affinity > PARAMETERS["garmentAffinityMargin"])
                & conflict_support
            )
            adaptive_garment = binary_dilation(
                adaptive_garment,
                iterations=PARAMETERS["garmentEdgeDilationPixels"],
            ) & (
                (y_grid >= garment_top)
                & (person_matte >= 0.5)
                & conflict_support
                & (garment_distance < PARAMETERS["garmentEdgePaletteDistance"])
                & (affinity > PARAMETERS["garmentAmbiguityMargin"])
            )
            strong_conflict = binary_dilation(
                conflict_search & (affinity > PARAMETERS["garmentAffinityMargin"]),
                iterations=2,
            ) & (coarse_hair > 0.2)
            ambiguous_conflict = (
                conflict_search
                & (affinity > PARAMETERS["garmentAmbiguityMargin"])
                & ~strong_conflict
            )

            trimap = np.zeros((height, width), dtype=np.uint8)
            trimap[hair_outer] = 128
            trimap[hair_core] = 255
            trimap[ambiguous_conflict] = 128
            trimap[strong_conflict] = 0
            trimap[shirt > 0.35] = 0

            print(f"[{position}/{len(avatars)}] {avatar_id}: running ViTMatte and foreground recovery...")
            inputs = matte_processor(images=source_image, trimaps=Image.fromarray(trimap), return_tensors="pt")
            with torch.inference_mode():
                alpha = matte_model(**inputs).alphas[0, 0].cpu().numpy()[:height, :width]
            alpha = np.clip(alpha, 0, 1).astype(np.float64)
            foreground, underlay = estimate_foreground_ml(source, alpha, return_background=True)
            palette_search = (coarse_hair > 0.2) & (y_grid >= garment_top)
            foreground = clean_foreground_colors(
                source, foreground, alpha, palette_search, hair_centers, garment_centers
            )

            expanded_conflict = binary_dilation(
                strong_conflict | ambiguous_conflict,
                iterations=PARAMETERS["conflictDilationPixels"],
            ) & conflict_support
            runtime_region = hair_region | expanded_conflict
            underlay_kind = np.zeros((height, width), dtype=np.uint8)
            underlay_kind[hair_outer & (person_matte < 0.92)] = 128
            underlay_kind[
                runtime_region
                & (person_matte >= 0.5)
                & ((shirt > 0.85) | adaptive_garment | expanded_conflict)
            ] = 255
            shirt_refined = np.maximum(
                shirt,
                (adaptive_garment | expanded_conflict).astype(np.float64),
            )
            shirt_refined = np.minimum(shirt_refined, person_matte)

            alpha_u8 = (alpha * 255 + 0.5).astype(np.uint8)
            active_hair = runtime_region | (alpha_u8 > 0)
            stored_color_region = binary_dilation(
                active_hair,
                iterations=PARAMETERS["storageHaloPixels"],
            )
            foreground_u8 = (foreground * 255 + 0.5).astype(np.uint8)
            foreground_u8[~stored_color_region] = 0
            underlay_u8 = (underlay * 255 + 0.5).astype(np.uint8)
            underlay_u8[~stored_color_region] = 0

            paths = {key: mask_directory / filename for key, filename in LAYER_FILES.items()}
            save_image(paths["region"], (runtime_region * 255).astype(np.uint8), "L")
            save_image(paths["trimap"], trimap, "L")
            save_image(paths["matte"], alpha_u8, "L")
            save_image(
                paths["foreground"],
                np.dstack(
                    [
                        foreground_u8,
                        alpha_u8,
                    ]
                ),
                "RGBA",
            )
            save_image(paths["underlay"], underlay_u8, "RGB")
            save_image(paths["underlayKind"], underlay_kind, "L")
            save_image(paths["shirtRefined"], (shirt_refined * 255 + 0.5).astype(np.uint8), "L")

            modes = {
                "region": "L",
                "trimap": "L",
                "matte": "L",
                "foreground": "RGBA",
                "underlay": "RGB",
                "underlayKind": "L",
                "shirtRefined": "L",
            }
            metadata["hairMatting"] = {
                "version": 1,
                "status": "unreviewed",
                "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "sourceSha256": source_hash,
                "purpose": "Reusable hair alpha and decontaminated foreground for background/garment recoloring.",
                "models": {
                    "semanticHair": {
                        "provider": "Google MediaPipe",
                        "model": "HairSegmenter",
                        "license": "Apache-2.0",
                        "sha256": HAIR_SEGMENTER_SHA256,
                    },
                    "matting": {
                        "provider": "HUST Vision Lab",
                        "model": VITMATTE_MODEL,
                        "revision": VITMATTE_REVISION,
                        "license": "Apache-2.0",
                    },
                    "foregroundRecovery": {
                        "provider": "PyMatting",
                        "method": "estimate_foreground_ml",
                        "license": "MIT",
                    },
                },
                "parameters": PARAMETERS,
                "layers": {
                    key: layer_metadata(path, modes[key]) for key, path in paths.items()
                },
                "review": None,
            }
            temporary_metadata = metadata_path.with_suffix(".json.tmp")
            temporary_metadata.write_text(json.dumps(metadata, indent=2) + "\n")
            temporary_metadata.replace(metadata_path)
            print(f"[{position}/{len(avatars)}] {avatar_id}: saved unreviewed hair-matting layers.")

    print("Hair-matting generation complete. Review every generated layer before production registration.")


if __name__ == "__main__":
    main()
