#!/usr/bin/env python3
"""Create deterministic Palari V2 runtime masks from an isolated RGBA master."""

from __future__ import annotations

import argparse
import colorsys
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def rgba_to_hsv(image: Image.Image):
    rgba = np.asarray(image, dtype=np.float32) / 255
    rgb = rgba[..., :3]
    maximum = rgb.max(axis=2)
    minimum = rgb.min(axis=2)
    difference = maximum - minimum
    saturation = np.divide(difference, maximum, out=np.zeros_like(maximum), where=maximum > 0)
    hue = np.zeros_like(maximum)
    active = difference > 0
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    red_max = active & (maximum == red)
    green_max = active & (maximum == green)
    blue_max = active & (maximum == blue)
    hue[red_max] = ((green[red_max] - blue[red_max]) / difference[red_max]) % 6
    hue[green_max] = (blue[green_max] - red[green_max]) / difference[green_max] + 2
    hue[blue_max] = (red[blue_max] - green[blue_max]) / difference[blue_max] + 4
    hue = (hue / 6) % 1
    return rgba[..., 3], rgb, hue, saturation, maximum


def dominant_characteristic_hue(
    alpha,
    hue,
    saturation,
    value,
    expected_hue: float | None,
    saturation_minimum: float,
) -> float:
    bins = np.zeros(180, dtype=np.float64)
    eligible = (
        (alpha >= 192 / 255)
        & (saturation >= saturation_minimum)
        & (value >= 0.08)
    )
    indices = (hue[eligible] * len(bins)).astype(np.int32) % len(bins)
    weights = saturation[eligible] * value[eligible]
    np.add.at(bins, indices, weights)
    if expected_hue is not None:
        centers = (np.arange(len(bins)) + 0.5) / len(bins)
        distance = np.minimum(np.abs(centers - expected_hue), 1 - np.abs(centers - expected_hue))
        bins[distance > 45 / 360] = 0
    if not bins.any():
        raise ValueError("Could not find a saturated characteristic-color region.")
    peak = max(range(len(bins)), key=bins.__getitem__)
    return (peak + 0.5) / len(bins)


def hex_hsv(hex_color: str):
    value = hex_color.removeprefix("#")
    red, green, blue = (int(value[offset : offset + 2], 16) / 255 for offset in (0, 2, 4))
    return colorsys.rgb_to_hsv(red, green, blue)


def generate_masks(
    source: Path,
    output_directory: Path,
    avatar_id: str,
    expected_color: str | None,
    expected_material: str | None,
    detection_hue_degrees: float | None,
    candidate_saturation_override: float | None,
    relaxed_color_key: bool,
    muted_characteristic: bool,
    review_status: str,
    reviewer: str | None,
    review_notes: str | None,
) -> None:
    image = Image.open(source).convert("RGBA")
    alpha, rgb, hue, saturation, value = rgba_to_hsv(image)
    expected_hsv = hex_hsv(expected_color) if expected_color else None
    expected_material_hsv = hex_hsv(expected_material) if expected_material else None
    detection_hue = (
        detection_hue_degrees / 360
        if detection_hue_degrees is not None
        else expected_hsv[0] if expected_hsv else None
    )
    hue_center = dominant_characteristic_hue(
        alpha,
        hue,
        saturation,
        value,
        detection_hue,
        0.18 if muted_characteristic else 0.55,
    )
    foreground = image.getchannel("A")
    warm_characteristic = bool(
        expected_hsv
        and (expected_hsv[0] < 55 / 360 or expected_hsv[0] > 330 / 360)
    )
    amber_characteristic = bool(
        expected_hsv
        and 20 / 360 <= expected_hsv[0] <= 55 / 360
        and expected_hsv[1] >= 0.70
    )
    hue_radius_degrees = 20 if warm_characteristic else 32
    hue_distance = np.minimum(np.abs(hue - hue_center), 1 - np.abs(hue - hue_center))
    if muted_characteristic:
        candidate_saturation_minimum = 0.12
        seed_saturation_minimum = 0.22
        candidate_color_energy_minimum = 0.02
        seed_color_energy_minimum = 0.04
    elif amber_characteristic and relaxed_color_key:
        candidate_saturation_minimum = 0.46
        seed_saturation_minimum = 0.70
        candidate_color_energy_minimum = 0.08
        seed_color_energy_minimum = 0.20
    elif amber_characteristic:
        candidate_saturation_minimum = 0.60
        seed_saturation_minimum = 0.75
        candidate_color_energy_minimum = 0.25
        seed_color_energy_minimum = 0.35
    else:
        candidate_saturation_minimum = 0.25
        seed_saturation_minimum = 0.45
        candidate_color_energy_minimum = 0.04
        seed_color_energy_minimum = 0.08
    if candidate_saturation_override is not None:
        candidate_saturation_minimum = candidate_saturation_override
        seed_saturation_minimum = max(seed_saturation_minimum, candidate_saturation_override)
    if muted_characteristic:
        blue_over_red = rgb[..., 2] - rgb[..., 0]
        blue_over_green = rgb[..., 2] - rgb[..., 1]
        candidate = (
            (alpha > 0.02)
            & (value > 0.02)
            & (blue_over_red > 0)
            & (blue_over_green > -0.025)
        )
        seed = (
            candidate
            & (blue_over_red >= 0.04)
            & (blue_over_green >= -0.005)
            & (saturation >= 0.08)
        )
    else:
        candidate = (
            (alpha > 0.02)
            & (hue_distance < hue_radius_degrees / 360)
            & (saturation >= candidate_saturation_minimum)
            & (value > 0.02)
            & ((saturation * value) >= candidate_color_energy_minimum)
        )
        seed = (
            candidate
            & (hue_distance < (hue_radius_degrees * 0.72) / 360)
            & (saturation >= seed_saturation_minimum)
            & ((saturation * value) >= seed_color_energy_minimum)
        )

    # A characteristic region is simply a connected patch of the expected
    # source color that contains at least two strong color-key pixels. This is
    # deliberately not semantic segmentation: no body-position rules, shape
    # guesses, or learned model are involved.
    components, component_count = ndimage.label(candidate, structure=np.ones((3, 3), dtype=np.uint8))
    component_sizes = np.bincount(components.ravel(), minlength=component_count + 1)
    seed_counts = np.bincount(components[seed].ravel(), minlength=component_count + 1)
    retained = seed_counts >= 2
    if relaxed_color_key:
        retained |= component_sizes >= 20
    retained[0] = False
    characteristic_region = retained[components] & candidate
    characteristic_amount = alpha * characteristic_region

    # Material is a second, independent source-color key. Pixels that are too
    # ambiguous to belong confidently to either palette remain untouched; a
    # shadow in the colored interior must never become ceramic merely because
    # it missed the characteristic key.
    material_value = expected_material_hsv[2] if expected_material_hsv else 0.85
    if material_value >= 0.70:
        if amber_characteristic:
            material_region = (
                (alpha > 0.02)
                & (value >= 0.30)
                & (saturation <= candidate_saturation_minimum)
            )
        else:
            material_region = (alpha > 0.02) & (value >= 0.30)
            material_region &= (saturation < 0.12) | (
                (saturation <= 0.75)
                & (hue_distance > (hue_radius_degrees * 0.65) / 360)
            )
        material_rule = "light-neutral"
    elif material_value <= 0.30:
        material_region = (
            (alpha > 0.02)
            & (saturation <= 0.24)
            & (value <= 0.68)
        )
        material_rule = "dark-neutral"
    else:
        material_region = (
            (alpha > 0.02)
            & (saturation <= 0.32)
            & (value >= 0.10)
        )
        material_rule = "mid-neutral"
    material_region &= ~characteristic_region
    material_amount = alpha * material_region

    # Soften only spatial boundaries. If the two edge ramps overlap, normalize
    # them back to the foreground alpha rather than allowing double tinting.
    characteristic = Image.fromarray(
        np.rint(characteristic_amount * 255).astype(np.uint8),
        "L",
    ).filter(ImageFilter.GaussianBlur(radius=0.55))
    material = Image.fromarray(
        np.rint(material_amount * 255).astype(np.uint8),
        "L",
    ).filter(ImageFilter.GaussianBlur(radius=0.55))
    characteristic_array = np.minimum(
        np.asarray(characteristic, dtype=np.float32) / 255,
        alpha,
    )
    material_array = np.minimum(
        np.asarray(material, dtype=np.float32) / 255,
        alpha,
    )
    combined = characteristic_array + material_array
    overlap = combined > alpha
    characteristic_array[overlap] *= alpha[overlap] / combined[overlap]
    material_array[overlap] *= alpha[overlap] / combined[overlap]
    characteristic = Image.fromarray(
        np.rint(characteristic_array * 255).astype(np.uint8),
        "L",
    )
    material = Image.fromarray(
        np.rint(material_array * 255).astype(np.uint8),
        "L",
    )

    output_directory.mkdir(parents=True, exist_ok=True)
    paths = {
        "source": output_directory / "source.png",
        "foreground": output_directory / "foreground.png",
        "material": output_directory / "material.png",
        "characteristic": output_directory / "characteristic.png",
    }
    if source.resolve() != paths["source"].resolve():
        image.save(paths["source"], optimize=True)
    foreground.save(paths["foreground"], optimize=True)
    material.save(paths["material"], optimize=True)
    characteristic.save(paths["characteristic"], optimize=True)

    metadata = {
        "version": 3,
        "avatarId": avatar_id,
        "sourceInput": str(source),
        "dimensions": [image.width, image.height],
        "characteristicHueDegrees": round(hue_center * 360, 3),
        "expectedCharacteristicColor": expected_color,
        "expectedMaterialColor": expected_material,
        "algorithm": {
            "name": "deterministic-source-color-key",
            "detectionHueOverrideDegrees": detection_hue_degrees,
            "hueRadiusDegrees": hue_radius_degrees,
            "candidateSaturationMinimum": candidate_saturation_minimum,
            "candidateColorEnergyMinimum": candidate_color_energy_minimum,
            "componentSeed": {
                "hueRadiusDegrees": round(hue_radius_degrees * 0.72, 3),
                "saturationMinimum": seed_saturation_minimum,
                "colorEnergyMinimum": seed_color_energy_minimum,
                "minimumPixels": 2,
                "relaxedComponentMinimumPixels": 20 if relaxed_color_key else None,
            },
            "warmCharacteristic": warm_characteristic,
            "amberCharacteristic": amber_characteristic,
            "candidateValueMinimum": 0.02,
            "relaxedColorKey": relaxed_color_key,
            "mutedCharacteristic": muted_characteristic,
            "mutedColorKey": (
                {
                    "rule": "blue-over-neutral",
                    "candidateBlueOverRedMinimum": 0,
                    "candidateBlueOverGreenMinimum": -0.025,
                    "seedBlueOverRedMinimum": 0.04,
                    "seedBlueOverGreenMinimum": -0.005,
                }
                if muted_characteristic
                else None
            ),
            "characteristicBlurRadius": 0.55,
            "materialColorKey": {
                "rule": material_rule,
                "expectedValue": round(material_value, 4),
            },
            "materialBlurRadius": 0.55,
            "independentColorKeys": True,
            "ambiguousPixelsRemainSource": True,
        },
        "checksums": {name: sha256(path) for name, path in paths.items()},
        "review": {
            "status": review_status,
            "reviewer": reviewer,
            "notes": review_notes,
        },
    }
    metadata_path = output_directory / "metadata.json"
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(f"Generated Palari V2 masks for {avatar_id} at {output_directory}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    parser.add_argument("--id", required=True)
    parser.add_argument("--expected-color")
    parser.add_argument("--expected-material")
    parser.add_argument("--detection-hue-degrees", type=float)
    parser.add_argument("--candidate-saturation-minimum", type=float)
    parser.add_argument("--relaxed-color-key", action="store_true")
    parser.add_argument("--muted-characteristic", action="store_true")
    parser.add_argument("--review-status", choices=("unreviewed", "pass", "fail"), default="unreviewed")
    parser.add_argument("--reviewer")
    parser.add_argument("--review-notes")
    arguments = parser.parse_args()
    generate_masks(
        arguments.source,
        arguments.out_dir,
        arguments.id,
        arguments.expected_color,
        arguments.expected_material,
        arguments.detection_hue_degrees,
        arguments.candidate_saturation_minimum,
        arguments.relaxed_color_key,
        arguments.muted_characteristic,
        arguments.review_status,
        arguments.reviewer,
        arguments.review_notes,
    )


if __name__ == "__main__":
    main()
