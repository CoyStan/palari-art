#!/usr/bin/env python3
"""Generate nondestructive face-aware framing metadata for bundled portraits.

The source portraits and every pixel-aligned mask remain unchanged. The browser
uses the generated scale and center values as one shared crop transform.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import urllib.request
from pathlib import Path

import mediapipe as mp
import numpy as np
from PIL import Image


REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_ROOT = REPOSITORY_ROOT / "public"
REGISTRY_PATH = REPOSITORY_ROOT / "src/data/avatar-masks.json"
OUTPUT_PATH = REPOSITORY_ROOT / "src/data/avatar-framing.json"

FACE_DETECTOR_URL = (
    "https://storage.googleapis.com/mediapipe-models/face_detector/"
    "blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
)
FACE_DETECTOR_SHA256 = "b4578f35940bf5a1a655214a1cce5cab13eba73c1297cd78e1a04c2380b0152f"

# Measured from the user-approved framing reference. The reference places the
# eyes near 40% of the square while retaining a small amount of upper chest.
TARGET_FACE_HEIGHT = 0.3662
TARGET_FACE_CENTER_X = 0.5
TARGET_FACE_CENTER_Y = 0.4653
MIN_HEAD_MARGIN = 0.035
MAX_ZOOM = 1.38


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id", help="Generate one registered avatar ID.")
    parser.add_argument("--all", action="store_true", help="Generate all registered avatars.")
    parser.add_argument("--model", type=Path, help="Use an existing verified FaceDetector model.")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    return parser.parse_args()


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verified_face_detector(requested_path: Path | None) -> Path:
    if requested_path:
        path = requested_path.expanduser().resolve()
        if not path.is_file():
            raise FileNotFoundError(f"MediaPipe model does not exist: {path}")
        actual = sha256_file(path)
        if actual != FACE_DETECTOR_SHA256:
            raise RuntimeError(
                f"MediaPipe checkpoint checksum changed: expected {FACE_DETECTOR_SHA256}, got {actual}."
            )
        return path

    cache_root = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache"))
    path = cache_root / "palari-art" / "blaze_face_short_range.tflite"
    if path.is_file() and sha256_file(path) == FACE_DETECTOR_SHA256:
        return path

    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    print("Downloading the Apache-2.0 MediaPipe FaceDetector checkpoint...")
    urllib.request.urlretrieve(FACE_DETECTOR_URL, temporary)
    actual = sha256_file(temporary)
    if actual != FACE_DETECTOR_SHA256:
        temporary.unlink(missing_ok=True)
        raise RuntimeError(
            f"MediaPipe checkpoint checksum changed: expected {FACE_DETECTOR_SHA256}, got {actual}."
        )
    temporary.replace(path)
    return path


def meaningful_bounds(mask: np.ndarray) -> tuple[int, int, int, int]:
    row_counts = mask.sum(axis=1)
    column_counts = mask.sum(axis=0)
    rows = np.flatnonzero(row_counts >= max(4, round(mask.shape[1] * 0.004)))
    columns = np.flatnonzero(column_counts >= max(4, round(mask.shape[0] * 0.004)))
    if rows.size == 0 or columns.size == 0:
        raise RuntimeError("Mask contains no meaningful foreground.")
    return int(columns[0]), int(rows[0]), int(columns[-1] + 1), int(rows[-1] + 1)


def largest_face(detections, width: int, height: int):
    if not detections:
        return None

    def rank(detection) -> float:
        box = detection.bounding_box
        center_x = (box.origin_x + box.width / 2) / width
        center_y = (box.origin_y + box.height / 2) / height
        area = (box.width * box.height) / (width * height)
        center_penalty = abs(center_x - 0.5) + abs(center_y - 0.45)
        return area - center_penalty * 0.03

    return max(detections, key=rank)


def generate_record(detector, avatar: dict[str, object]) -> dict[str, object]:
    avatar_id = str(avatar["id"])
    source_path = PUBLIC_ROOT / str(avatar["source"])
    person_path = PUBLIC_ROOT / "masks" / avatar_id / "person.png"
    shirt_path = PUBLIC_ROOT / "masks" / avatar_id / "shirt.png"

    with Image.open(source_path) as source_image:
        width, height = source_image.size
    if width != height:
        raise RuntimeError(f"{avatar_id}: framing expects a square portrait.")

    person = np.asarray(Image.open(person_path).convert("L")) >= 128
    shirt = np.asarray(Image.open(shirt_path).convert("L")) >= 128
    _, subject_top, _, _ = meaningful_bounds(person)
    _, shirt_top, _, _ = meaningful_bounds(shirt)

    result = detector.detect(mp.Image.create_from_file(str(source_path)))
    detection = largest_face(result.detections, width, height)
    if detection is None:
        raise RuntimeError(f"{avatar_id}: MediaPipe did not detect a face.")

    box = detection.bounding_box
    face_left = max(0.0, box.origin_x / width)
    face_top = max(0.0, box.origin_y / height)
    face_width = min(1.0 - face_left, box.width / width)
    face_height = min(1.0 - face_top, box.height / height)
    face_center_x = face_left + face_width / 2
    face_center_y = face_top + face_height / 2
    face_bottom = face_top + face_height

    # Protect the complete head, hair, and headwear above the shoulders. Lower
    # garment width is deliberately excluded because chest is what we crop.
    head_band_bottom = min(height, round((face_bottom + 0.055) * height))
    head_mask = person[:head_band_bottom]
    head_columns = np.flatnonzero(
        head_mask.sum(axis=0) >= max(4, round(head_mask.shape[0] * 0.004))
    )
    if head_columns.size:
        head_left = head_columns[0] / width
        head_right = (head_columns[-1] + 1) / width
    else:
        head_left = face_left
        head_right = face_left + face_width

    requested_scale = TARGET_FACE_HEIGHT / face_height
    head_width = max(face_width, head_right - head_left)
    head_safe_scale = (1 - MIN_HEAD_MARGIN * 2) / head_width
    scale = min(MAX_ZOOM, head_safe_scale, max(1.0, requested_scale))
    crop_size = 1 / scale

    crop_left = face_center_x - TARGET_FACE_CENTER_X / scale
    crop_top = face_center_y - TARGET_FACE_CENTER_Y / scale

    # Shift, rather than shrink, when hair or headwear needs more top clearance.
    normalized_subject_top = subject_top / height
    top_limit = normalized_subject_top - MIN_HEAD_MARGIN / scale
    crop_top = min(crop_top, top_limit)

    # Keep the head band within the horizontal safe area.
    left_limit = head_left - MIN_HEAD_MARGIN / scale
    right_limit = head_right - (1 - MIN_HEAD_MARGIN) / scale
    crop_left = min(crop_left, left_limit)
    crop_left = max(crop_left, right_limit)

    crop_left = min(max(0.0, crop_left), 1 - crop_size)
    crop_top = min(max(0.0, crop_top), 1 - crop_size)
    center_x = crop_left + crop_size / 2
    center_y = crop_top + crop_size / 2

    score = float(detection.categories[0].score) if detection.categories else 0.0
    return {
        "id": avatar_id,
        "sourceSha256": sha256_file(source_path),
        "scale": round(scale, 5),
        "centerX": round(center_x, 5),
        "centerY": round(center_y, 5),
        "audit": {
            "detectorConfidence": round(score, 5),
            "faceBox": [
                round(face_left, 5),
                round(face_top, 5),
                round(face_width, 5),
                round(face_height, 5),
            ],
            "subjectTop": round(normalized_subject_top, 5),
            "shirtTop": round(shirt_top / height, 5),
        },
    }


def main() -> None:
    args = parse_args()
    registry = json.loads(REGISTRY_PATH.read_text())
    all_avatars = registry["avatars"]
    avatars = all_avatars
    if args.id:
        avatars = [avatar for avatar in avatars if avatar["id"] == args.id]
    elif not args.all:
        raise RuntimeError("Pass --all or --id=<registered-avatar-id>.")
    if not avatars:
        raise RuntimeError("No matching registered avatars were found.")

    model_path = verified_face_detector(args.model)
    options = mp.tasks.vision.FaceDetectorOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(model_path)),
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        min_detection_confidence=0.3,
    )
    records = []
    with mp.tasks.vision.FaceDetector.create_from_options(options) as detector:
        for index, avatar in enumerate(avatars, start=1):
            record = generate_record(detector, avatar)
            records.append(record)
            print(
                f"[{index}/{len(avatars)}] {record['id']}: "
                f"scale={record['scale']:.3f} center=({record['centerX']:.3f}, {record['centerY']:.3f})"
            )

    if args.id:
        if not args.output.is_file():
            raise RuntimeError("A single-ID refresh requires an existing complete framing registry.")
        current = json.loads(args.output.read_text())
        replacements = {record["id"]: record for record in records}
        current_records = {record["id"]: record for record in current.get("avatars", [])}
        current_records.update(replacements)
        records = [current_records[avatar["id"]] for avatar in all_avatars]

    output = {
        "version": 1,
        "method": "MediaPipe BlazeFace short-range plus reviewed person/shirt safety bounds",
        "model": {
            "url": FACE_DETECTOR_URL,
            "sha256": FACE_DETECTOR_SHA256,
        },
        "target": {
            "faceHeight": TARGET_FACE_HEIGHT,
            "faceCenterX": TARGET_FACE_CENTER_X,
            "faceCenterY": TARGET_FACE_CENTER_Y,
            "minimumHeadMargin": MIN_HEAD_MARGIN,
            "maximumScale": MAX_ZOOM,
        },
        "avatars": records,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix(f"{args.output.suffix}.tmp")
    temporary.write_text(json.dumps(output, indent=2) + "\n")
    temporary.replace(args.output)
    print(f"Wrote {len(records)} framing records to {args.output}.")


if __name__ == "__main__":
    main()
