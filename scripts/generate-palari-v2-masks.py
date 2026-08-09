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
    return rgba[..., 3], hue, saturation, maximum


def dominant_characteristic_hue(alpha, hue, saturation, value, expected_hue: float | None) -> float:
    bins = np.zeros(180, dtype=np.float64)
    eligible = (alpha >= 192 / 255) & (saturation >= 0.55) & (value >= 0.08)
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
    review_status: str,
    reviewer: str | None,
    review_notes: str | None,
) -> None:
    image = Image.open(source).convert("RGBA")
    alpha, hue, saturation, value = rgba_to_hsv(image)
    expected_hsv = hex_hsv(expected_color) if expected_color else None
    hue_center = dominant_characteristic_hue(
        alpha,
        hue,
        saturation,
        value,
        expected_hsv[0] if expected_hsv else None,
    )
    foreground = image.getchannel("A")
    bright_characteristic = bool(expected_hsv and expected_hsv[2] > 0.65)
    warm_characteristic = bool(expected_hsv and (expected_hsv[0] < 50 / 360 or expected_hsv[0] > 330 / 360))
    saturation_sensitive = bright_characteristic or warm_characteristic
    hue_radius_degrees = 20 if saturation_sensitive else 32
    hue_distance = np.minimum(np.abs(hue - hue_center), 1 - np.abs(hue - hue_center))
    hue_amount = np.clip(1 - hue_distance / (hue_radius_degrees / 360), 0, 1)
    saturation_minimum = 0.38 if saturation_sensitive else 0.12
    saturation_span = 0.22 if saturation_sensitive else 0.38
    saturation_amount = np.clip((saturation - saturation_minimum) / saturation_span, 0, 1)
    value_amount = np.clip((value - 0.035) / 0.12, 0, 1)
    candidate = (alpha > 0.2) & (hue_amount > 0.2) & (saturation > 0.25) & (value > 0.035)
    color_energy = saturation * value
    seed_value_minimum = 0.32 if bright_characteristic else 0.06
    component_seed_ratio = 0.04 if bright_characteristic else 0.01
    seed = candidate & (hue_amount > 0.72) & (saturation > 0.45) & (color_energy > 0.12) & (value > seed_value_minimum)
    accent_seed = candidate & (hue_amount > 0.20) & (saturation > 0.32) & (color_energy > 0.10) & (value > seed_value_minimum)
    components, component_count = ndimage.label(candidate, structure=np.ones((3, 3), dtype=np.uint8))
    sizes = np.bincount(components.ravel(), minlength=component_count + 1)
    seed_counts = np.bincount(components[seed].ravel(), minlength=component_count + 1)
    accent_seed_counts = np.bincount(components[accent_seed].ravel(), minlength=component_count + 1)
    energy_sums = np.bincount(
        components[candidate].ravel(),
        weights=color_energy[candidate].ravel(),
        minlength=component_count + 1,
    )
    mean_energy = np.divide(energy_sums, sizes, out=np.zeros_like(energy_sums), where=sizes > 0)
    best_component_energy = mean_energy[1:].max(initial=0)
    energy_floor = 0.08 if saturation_sensitive else 0.04
    relative_energy_floor = 0.45 if saturation_sensitive else 0.20
    energy_quality = mean_energy >= max(energy_floor, best_component_energy * relative_energy_floor)
    minimum_seed_counts = np.maximum(4, np.ceil(sizes * component_seed_ratio))
    retained = ((seed_counts >= minimum_seed_counts) | (
        (sizes >= 8) & (sizes <= 10000) & (accent_seed_counts >= 2)
    )) & energy_quality
    retained[0] = False
    mask_floor = None
    use_wide_accents = False
    if saturation_sensitive:
        characteristic_amount = alpha * hue_amount * saturation_amount * value_amount * retained[components]
        mask_floor = 0.25 if bright_characteristic else 0.10
        characteristic_amount = np.clip((characteristic_amount - mask_floor) / (1 - mask_floor), 0, 1)
    else:
        deep_region = retained[components] & candidate
        deep_region = ndimage.binary_closing(
            deep_region,
            structure=np.ones((11, 11), dtype=np.uint8),
        )
        y_grid, x_grid = np.indices(alpha.shape)
        central_band = (x_grid > image.width * 0.28) & (x_grid < image.width * 0.72)
        accent_band = central_band & ((y_grid < image.height * 0.50) | (y_grid > image.height * 0.62))
        wide_hue_distance = np.minimum(np.abs(hue - hue_center), 1 - np.abs(hue - hue_center))
        use_wide_accents = bool(expected_hsv and 200 / 360 <= expected_hsv[0] <= 330 / 360)
        wide_accents = use_wide_accents & accent_band & (alpha > 0.2) & (wide_hue_distance < 60 / 360) & (saturation > 0.20) & (value > 0.03)
        wide_components, wide_count = ndimage.label(wide_accents, structure=np.ones((3, 3), dtype=np.uint8))
        wide_sizes = np.bincount(wide_components.ravel(), minlength=wide_count + 1)
        wide_energy_sums = np.bincount(
            wide_components[wide_accents].ravel(),
            weights=color_energy[wide_accents].ravel(),
            minlength=wide_count + 1,
        )
        wide_mean_energy = np.divide(
            wide_energy_sums,
            wide_sizes,
            out=np.zeros(wide_energy_sums.shape, dtype=np.float64),
            where=wide_sizes > 0,
        )
        wide_retained = (wide_sizes >= 8) & (wide_sizes <= 6000) & (wide_mean_energy >= 0.04)
        wide_retained[0] = False
        deep_region |= wide_retained[wide_components]
        characteristic_amount = alpha * deep_region
    characteristic = Image.fromarray(np.rint(characteristic_amount * 255).astype(np.uint8), "L")
    material = Image.fromarray(np.rint(alpha * (1 - characteristic_amount) * 255).astype(np.uint8), "L")

    # A subpixel blur avoids seams when the two recolored regions meet.
    characteristic = characteristic.filter(ImageFilter.GaussianBlur(radius=0.55))
    material = material.filter(ImageFilter.GaussianBlur(radius=0.45))

    output_directory.mkdir(parents=True, exist_ok=True)
    paths = {
        "source": output_directory / "source.png",
        "foreground": output_directory / "foreground.png",
        "material": output_directory / "material.png",
        "characteristic": output_directory / "characteristic.png",
    }
    image.save(paths["source"], optimize=True)
    foreground.save(paths["foreground"], optimize=True)
    material.save(paths["material"], optimize=True)
    characteristic.save(paths["characteristic"], optimize=True)

    metadata = {
        "version": 1,
        "avatarId": avatar_id,
        "sourceInput": str(source),
        "dimensions": [image.width, image.height],
        "characteristicHueDegrees": round(hue_center * 360, 3),
        "expectedCharacteristicColor": expected_color,
        "algorithm": {
            "name": "hsv-characteristic-separation",
            "hueRadiusDegrees": hue_radius_degrees,
            "saturationRamp": [saturation_minimum, saturation_minimum + saturation_span],
            "componentSeed": {
                "hueAmountMinimum": 0.72,
                "saturationMinimum": 0.45,
                "colorEnergyMinimum": 0.12,
                "valueMinimum": seed_value_minimum,
                "minimumPixels": 4,
                "minimumComponentRatio": component_seed_ratio,
                "smallAccentSaturationMinimum": 0.32,
                "smallAccentColorEnergyMinimum": 0.10,
                "smallAccentComponentRange": [8, 10000],
                "componentMeanEnergyFloor": energy_floor,
                "componentRelativeEnergyFloor": relative_energy_floor,
            },
            "saturationSensitive": saturation_sensitive,
            "characteristicMaskFloor": mask_floor if saturation_sensitive else None,
            "deepCharacteristicUsesRetainedHue": not saturation_sensitive,
            "deepCharacteristicClosingSize": 11 if not saturation_sensitive else None,
            "deepAccentHueRadiusDegrees": 60 if not saturation_sensitive and use_wide_accents else None,
            "valueRamp": [0.035, 0.155],
            "characteristicBlurRadius": 0.55,
            "materialBlurRadius": 0.45,
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
    parser.add_argument("--review-status", choices=("unreviewed", "pass", "fail"), default="unreviewed")
    parser.add_argument("--reviewer")
    parser.add_argument("--review-notes")
    arguments = parser.parse_args()
    generate_masks(
        arguments.source,
        arguments.out_dir,
        arguments.id,
        arguments.expected_color,
        arguments.review_status,
        arguments.reviewer,
        arguments.review_notes,
    )


if __name__ == "__main__":
    main()
