#!/usr/bin/env python3
"""Audit and render a Palari V2 GLB inside Blender without modifying it."""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--skip-render", action="store_true")
    return parser.parse_args(argv)


def look_at(camera: bpy.types.Object, target: Vector) -> None:
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()


def render_views(model: bpy.types.Object, output_dir: Path, center: Vector, size: Vector) -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 16
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    if scene.world is None:
        scene.world = bpy.data.worlds.new("Audit World")
    scene.world.color = (0.055, 0.055, 0.055)

    bpy.ops.object.camera_add()
    camera = bpy.context.object
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = max(size.x, size.z) * 1.18
    scene.camera = camera

    bpy.ops.object.light_add(type="AREA", location=(4, -4, center.z + 5))
    key = bpy.context.object
    key.data.energy = 900
    key.data.shape = "DISK"
    key.data.size = 5
    bpy.ops.object.light_add(type="AREA", location=(-4, 2, center.z + 2))
    fill = bpy.context.object
    fill.data.energy = 500
    fill.data.size = 4

    distance = max(size) * 2.6
    views = {
        "negative-y": Vector((center.x, center.y - distance, center.z)),
        "positive-x": Vector((center.x + distance, center.y, center.z)),
        "positive-y": Vector((center.x, center.y + distance, center.z)),
        "negative-x": Vector((center.x - distance, center.y, center.z)),
    }
    for name, location in views.items():
        camera.location = location
        look_at(camera, center)
        scene.render.filepath = str(output_dir / f"original-{name}.png")
        bpy.ops.render.render(write_still=True)


def main() -> None:
    args = parse_args()
    input_path = args.input.resolve()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(input_path))
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if len(mesh_objects) != 1:
        raise RuntimeError(f"Expected exactly one mesh, found {len(mesh_objects)}")

    model = mesh_objects[0]
    bpy.context.view_layer.objects.active = model
    model.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    world_vertices = [model.matrix_world @ vertex.co for vertex in model.data.vertices]
    minima = Vector(tuple(min(vertex[axis] for vertex in world_vertices) for axis in range(3)))
    maxima = Vector(tuple(max(vertex[axis] for vertex in world_vertices) for axis in range(3)))
    center = (minima + maxima) * 0.5
    size = maxima - minima

    edge_counts: dict[tuple[int, int], int] = {}
    for polygon in model.data.polygons:
        vertices = polygon.vertices
        for index in range(len(vertices)):
            edge = tuple(sorted((vertices[index], vertices[(index + 1) % len(vertices)])))
            edge_counts[edge] = edge_counts.get(edge, 0) + 1

    boundary_edges = sum(1 for count in edge_counts.values() if count == 1)
    nonmanifold_edges = sum(1 for count in edge_counts.values() if count != 2)
    uv_layers = [layer.name for layer in model.data.uv_layers]

    slices = []
    for fraction in (0.15, 0.3, 0.45, 0.55, 0.65, 0.8):
        z = minima.z + size.z * fraction
        tolerance = size.z * 0.0125
        band = [vertex for vertex in world_vertices if abs(vertex.z - z) <= tolerance]
        if not band:
            continue
        slices.append({
            "heightFraction": fraction,
            "z": z,
            "vertices": len(band),
            "x": [min(vertex.x for vertex in band), max(vertex.x for vertex in band)],
            "y": [min(vertex.y for vertex in band), max(vertex.y for vertex in band)],
        })

    rear_profile = []
    central_half_width = size.x * 0.18
    for step in range(21, 80, 2):
        fraction = step / 100
        z = minima.z + size.z * fraction
        tolerance = size.z * 0.008
        band = sorted(
            vertex.y
            for vertex in world_vertices
            if abs(vertex.x - center.x) <= central_half_width and abs(vertex.z - z) <= tolerance
        )
        if not band:
            continue
        rear_profile.append({
            "heightFraction": fraction,
            "z": z,
            "vertices": len(band),
            "maxY": band[-1],
            "p95Y": band[math.floor((len(band) - 1) * 0.95)],
            "p75Y": band[math.floor((len(band) - 1) * 0.75)],
        })

    audit = {
        "input": str(input_path),
        "objects": len(mesh_objects),
        "vertices": len(model.data.vertices),
        "triangles": sum(len(polygon.vertices) - 2 for polygon in model.data.polygons),
        "bounds": {"min": list(minima), "max": list(maxima), "size": list(size)},
        "boundaryEdges": boundary_edges,
        "nonmanifoldEdges": nonmanifold_edges,
        "materials": [slot.material.name if slot.material else None for slot in model.material_slots],
        "uvLayers": uv_layers,
        "slices": slices,
        "rearProfile": rear_profile,
        "blender": bpy.app.version_string,
    }
    (output_dir / "audit.json").write_text(json.dumps(audit, indent=2) + "\n")
    if not args.skip_render:
        render_views(model, output_dir, center, size)
    print(json.dumps(audit, indent=2))


if __name__ == "__main__":
    main()
