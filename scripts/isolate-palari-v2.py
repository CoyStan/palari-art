#!/usr/bin/env python3
"""Create a transparent Palari V2 master with a pinned local RMBG model."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import torch
from PIL import Image
from torchvision import transforms
from transformers import AutoModelForImageSegmentation

MODEL_ID = "briaai/RMBG-1.4"
MODEL_REVISION = "2ceba5a5efaec153162aedea169f76caf9b46cf8"
MODEL_SIZE = (1024, 1024)


def load_model():
    model = AutoModelForImageSegmentation.from_pretrained(
        MODEL_ID,
        revision=MODEL_REVISION,
        trust_remote_code=True,
    )
    model.eval()
    return model


def isolate(source: Path, output: Path, model) -> None:
    transform = transforms.Compose(
        [
            transforms.Resize(MODEL_SIZE),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )
    image = Image.open(source).convert("RGB")
    with torch.no_grad():
        matte = model(transform(image).unsqueeze(0))[0][0].cpu()[0].squeeze()
    alpha = transforms.ToPILImage()(matte).resize(image.size, Image.Resampling.LANCZOS)
    isolated = image.copy()
    isolated.putalpha(alpha)
    output.parent.mkdir(parents=True, exist_ok=True)
    isolated.save(output, optimize=True)
    print(f"Isolated {source} to {output} with {MODEL_ID}@{MODEL_REVISION}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--collection", type=Path)
    parser.add_argument("--output-root", type=Path, default=Path("public/palari-v2"))
    arguments = parser.parse_args()
    if arguments.collection:
        collection = json.loads(arguments.collection.read_text(encoding="utf-8"))
        model = load_model()
        for avatar in collection["avatars"]:
            isolate(
                Path(avatar["source"]),
                arguments.output_root / avatar["id"] / "source.png",
                model,
            )
        return
    if not arguments.source or not arguments.output:
        parser.error("provide --collection or both --source and --output")
    isolate(arguments.source, arguments.output, load_model())


if __name__ == "__main__":
    main()
