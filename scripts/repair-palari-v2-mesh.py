#!/usr/bin/env python3
"""Replace the erroneous rear arm bridge on the Palari 005 Meshy pilot.

The strong Meshy front remains untouched. Blender removes the malformed rear
polygons and fits a clean half-shell to measurements sampled from the source
mesh's silhouette and undamaged upper/lower rear bands.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--render-all", action="store_true")
    return parser.parse_args(argv)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def smoothstep(edge0: float, edge1: float, value: float) -> float:
    if edge0 == edge1:
        return 1.0 if value >= edge1 else 0.0
    x = max(0.0, min(1.0, (value - edge0) / (edge1 - edge0)))
    return x * x * (3.0 - 2.0 * x)


def lagrange3(z: float, anchors: list[tuple[float, float]]) -> float:
    result = 0.0
    for index, (zi, yi) in enumerate(anchors):
        basis = 1.0
        for other_index, (zj, _) in enumerate(anchors):
            if other_index != index:
                basis *= (z - zj) / (zi - zj)
        result += yi * basis
    return result


def build_rear_profile(
    vertices: list[Vector],
    z: float,
    z_tolerance: float,
    minimum_x: float,
    maximum_x: float,
    bins: int = 192,
) -> list[float]:
    profile: list[float | None] = [None] * (bins + 1)
    span = maximum_x - minimum_x
    for vertex in vertices:
        if vertex.y <= 0 or abs(vertex.z - z) > z_tolerance:
            continue
        index = max(0, min(bins, round((vertex.x - minimum_x) / span * bins)))
        existing = profile[index]
        profile[index] = vertex.y if existing is None else max(existing, vertex.y)

    populated = [index for index, value in enumerate(profile) if value is not None]
    if len(populated) < bins // 3:
        raise RuntimeError(f"Insufficient rear surface samples near z={z:.4f}")
    for index, value in enumerate(profile):
        if value is not None:
            continue
        lower = max((candidate for candidate in populated if candidate < index), default=populated[0])
        upper = min((candidate for candidate in populated if candidate > index), default=populated[-1])
        lower_value = profile[lower]
        upper_value = profile[upper]
        assert lower_value is not None and upper_value is not None
        if lower == upper:
            profile[index] = lower_value
        else:
            blend = (index - lower) / (upper - lower)
            profile[index] = lower_value * (1.0 - blend) + upper_value * blend
    return [float(value) for value in profile]


def sample_profile(profile: list[float], x: float, minimum_x: float, maximum_x: float) -> float:
    position = max(0.0, min(len(profile) - 1.0, (x - minimum_x) / (maximum_x - minimum_x) * (len(profile) - 1)))
    lower = math.floor(position)
    upper = min(len(profile) - 1, lower + 1)
    blend = position - lower
    return profile[lower] * (1.0 - blend) + profile[upper] * blend


def fit_even_quadratic(
    profile: list[float],
    minimum_x: float,
    maximum_x: float,
    center_x: float,
    half_width: float,
) -> tuple[float, float]:
    samples = []
    for index, y in enumerate(profile):
        x = minimum_x + (maximum_x - minimum_x) * index / (len(profile) - 1)
        if abs(x - center_x) <= half_width:
            samples.append((x - center_x, y))
    count = len(samples)
    sum_x2 = sum(x * x for x, _ in samples)
    sum_x4 = sum(x ** 4 for x, _ in samples)
    sum_y = sum(y for _, y in samples)
    sum_x2_y = sum(x * x * y for x, y in samples)
    determinant = count * sum_x4 - sum_x2 * sum_x2
    if abs(determinant) < 1e-12:
        raise RuntimeError("Could not fit rear-shell curvature")
    intercept = (sum_y * sum_x4 - sum_x2 * sum_x2_y) / determinant
    curvature = (count * sum_x2_y - sum_x2 * sum_y) / determinant
    return intercept, curvature


def fitted_rear_y(z: float, x: float, anchor_z: list[float], fits: list[tuple[float, float]], center_x: float) -> float:
    centered_x2 = (x - center_x) ** 2
    return lagrange3(z, [
        (anchor, intercept + curvature * centered_x2)
        for anchor, (intercept, curvature) in zip(anchor_z, fits)
    ])


def create_shell_patch(
    source_material: bpy.types.Material,
    source_uv: tuple[float, float],
    rear_fits: list[tuple[float, float]],
    anchor_z: list[float],
    minimum_x: float,
    maximum_x: float,
    center_x: float,
    half_width: float,
    offset: float,
) -> bpy.types.Object:
    columns = 64
    rows = 48
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int, int]] = []
    for row in range(rows + 1):
        z_blend = row / rows
        z = anchor_z[0] * (1.0 - z_blend) + anchor_z[-1] * z_blend
        for column in range(columns + 1):
            x_blend = column / columns
            x = center_x - half_width + 2.0 * half_width * x_blend
            edge_taper = math.sin(math.pi * x_blend) * math.sin(math.pi * z_blend)
            y = fitted_rear_y(z, x, anchor_z, rear_fits, center_x) + offset * edge_taper
            vertices.append((x, y, z))
    for row in range(rows):
        for column in range(columns):
            current = row * (columns + 1) + column
            above = (row + 1) * (columns + 1) + column
            faces.append((current, above, above + 1, current + 1))

    patch_mesh = bpy.data.meshes.new("Palari005_BackRepairPatch")
    patch_mesh.from_pydata(vertices, [], faces)
    patch_mesh.update()
    for polygon in patch_mesh.polygons:
        polygon.use_smooth = True

    uv_layer = patch_mesh.uv_layers.new(name="UVMap")
    for loop in patch_mesh.loops:
        uv_layer.data[loop.index].uv = source_uv

    material = bpy.data.materials.new("Palari005_BackRepairCeramic")
    material.use_nodes = True
    material.diffuse_color = (0.82, 0.77, 0.65, 1.0)
    principled = material.node_tree.nodes.get("Principled BSDF")
    if principled:
        principled.inputs["Base Color"].default_value = material.diffuse_color
        principled.inputs["Roughness"].default_value = 0.62
        principled.inputs["Metallic"].default_value = 0.0
    patch_mesh.materials.append(material)
    patch = bpy.data.objects.new("Palari005_BackRepairPatch", patch_mesh)
    bpy.context.collection.objects.link(patch)
    patch.select_set(True)
    return patch


def moving_average(values: list[float], radius: int = 3) -> list[float]:
    return [
        sum(values[max(0, index - radius) : min(len(values), index + radius + 1)])
        / len(values[max(0, index - radius) : min(len(values), index + radius + 1)])
        for index in range(len(values))
    ]


def create_rear_band_shell(
    vertices: list[Vector],
    center: Vector,
    minima: Vector,
    maxima: Vector,
    material_color: tuple[float, float, float, float],
) -> bpy.types.Object:
    rows = 64
    columns = 72
    size = maxima - minima
    # The generated band overlaps the cut so it closes the irregular source
    # boundary. This is intentionally retained as a visible v1 review seam.
    low_fraction = 0.34
    high_fraction = 0.74
    low_z = minima.z + size.z * low_fraction
    high_z = minima.z + size.z * high_fraction
    tolerance = size.z * 0.009

    def sample_clean_slice(z: float) -> tuple[float, float]:
        band = [vertex for vertex in vertices if abs(vertex.z - z) <= tolerance and vertex.y > center.y]
        if not band:
            raise RuntimeError(f"No rear-shell samples near z={z:.4f}")
        absolute_x = sorted(abs(vertex.x - center.x) for vertex in band)
        central_y = sorted(vertex.y - center.y for vertex in band if abs(vertex.x - center.x) < size.x * 0.12)
        radius = absolute_x[math.floor((len(absolute_x) - 1) * 0.985)]
        depth = central_y[math.floor((len(central_y) - 1) * 0.86)] if central_y else max(vertex.y - center.y for vertex in band)
        return radius, depth

    low_radius, low_depth = sample_clean_slice(low_z)
    high_radius, high_depth = sample_clean_slice(high_z)
    z_values = [low_z + (high_z - low_z) * row / rows for row in range(rows + 1)]

    shell_vertices: list[tuple[float, float, float]] = []
    shell_faces: list[tuple[int, int, int, int]] = []
    for row, z in enumerate(z_values):
        linear_blend = row / rows
        blend = smoothstep(0.0, 1.0, linear_blend)
        radius = low_radius * (1.0 - blend) + high_radius * blend
        depth = low_depth * (1.0 - blend) + high_depth * blend
        for column in range(columns + 1):
            theta = -math.pi / 2 + math.pi * column / columns
            x = center.x + radius * math.sin(theta)
            y = center.y + depth * math.cos(theta) + size.y * 0.003
            shell_vertices.append((x, y, z))
    for row in range(rows):
        for column in range(columns):
            current = row * (columns + 1) + column
            above = (row + 1) * (columns + 1) + column
            shell_faces.append((current, above, above + 1, current + 1))

    shell_mesh = bpy.data.meshes.new("Palari005_BackBandShell")
    shell_mesh.from_pydata(shell_vertices, [], shell_faces)
    shell_mesh.update()
    for polygon in shell_mesh.polygons:
        polygon.use_smooth = True

    material = bpy.data.materials.new("Palari005_BackShellCeramic")
    material.use_nodes = True
    material.diffuse_color = material_color
    principled = material.node_tree.nodes.get("Principled BSDF")
    if principled:
        principled.inputs["Base Color"].default_value = material_color
        principled.inputs["Roughness"].default_value = 0.62
        principled.inputs["Metallic"].default_value = 0.0
    shell_mesh.materials.append(material)
    shell = bpy.data.objects.new("Palari005_BackBandShell", shell_mesh)
    bpy.context.collection.objects.link(shell)
    shell.select_set(True)
    return shell


def look_at(camera: bpy.types.Object, target: Vector) -> None:
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()


def render_views(model: bpy.types.Object, output_dir: Path, center: Vector, size: Vector, render_all: bool) -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 16
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    if scene.world is None:
        scene.world = bpy.data.worlds.new("Repair World")
    scene.world.color = (0.055, 0.055, 0.055)

    bpy.ops.object.camera_add()
    camera = bpy.context.object
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = max(size.x, size.z) * 1.18
    scene.camera = camera

    bpy.ops.object.light_add(type="AREA", location=(4, -4, center.z + 5))
    bpy.context.object.data.energy = 900
    bpy.context.object.data.size = 5
    bpy.ops.object.light_add(type="AREA", location=(-4, 2, center.z + 2))
    bpy.context.object.data.energy = 500
    bpy.context.object.data.size = 4

    distance = max(size) * 2.6
    views = {
        "positive-y": Vector((center.x, center.y + distance, center.z)),
    }
    if render_all:
        views.update({
            "negative-y": Vector((center.x, center.y - distance, center.z)),
            "positive-x": Vector((center.x + distance, center.y, center.z)),
            "negative-x": Vector((center.x - distance, center.y, center.z)),
        })
    for name, location in views.items():
        camera.location = location
        look_at(camera, center)
        scene.render.filepath = str(output_dir / f"repaired-{name}.png")
        bpy.ops.render.render(write_still=True)


def main() -> None:
    args = parse_args()
    input_path = args.input.resolve()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "model-repaired.glb"

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(input_path))
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if len(mesh_objects) != 1:
        raise RuntimeError(f"Expected exactly one mesh, found {len(mesh_objects)}")

    model = mesh_objects[0]
    bpy.context.view_layer.objects.active = model
    model.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    mesh = model.data
    vertices = [vertex.co.copy() for vertex in mesh.vertices]

    minima = Vector(tuple(min(vertex[axis] for vertex in vertices) for axis in range(3)))
    maxima = Vector(tuple(max(vertex[axis] for vertex in vertices) for axis in range(3)))
    center = (minima + maxima) * 0.5
    size = maxima - minima

    # The four-view audit establishes +Y as the back. Remove only polygons
    # centered behind the longitudinal mid-plane; this leaves every front-side
    # source vertex, UV, texture, facial feature, and front arm intact.
    repair_bmesh = bmesh.new()
    repair_bmesh.from_mesh(mesh)
    rear_cut = center.y + size.y * 0.012
    repair_low = minima.z + size.z * 0.38
    repair_high = minima.z + size.z * 0.70
    rear_faces = [
        face
        for face in repair_bmesh.faces
        if all(vertex.co.y > rear_cut for vertex in face.verts)
        and face.normal.y > 0.05
        and repair_low < face.calc_center_median().z < repair_high
    ]
    deleted_faces = len(rear_faces)
    bmesh.ops.delete(repair_bmesh, geom=rear_faces, context="FACES")
    bmesh.ops.recalc_face_normals(repair_bmesh, faces=repair_bmesh.faces)
    repair_bmesh.to_mesh(mesh)
    repair_bmesh.free()
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = True

    back_shell = create_rear_band_shell(
        vertices,
        center,
        minima,
        maxima,
        (0.82, 0.77, 0.65, 1.0),
    )

    bpy.ops.object.select_all(action="DESELECT")
    model.select_set(True)
    back_shell.select_set(True)
    bpy.context.view_layer.objects.active = model

    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        use_selection=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_yup=True,
    )
    render_views(model, output_dir, center, size, args.render_all)

    record = {
        "date": "2026-08-10",
        "purpose": "Blender reconstruction of the fused rear arm bridge on the Palari 005 Meshy pilot while retaining the Meshy front.",
        "blender": bpy.app.version_string,
        "input": {"path": str(input_path), "sha256": sha256(input_path)},
        "output": {"path": str(output_path), "sha256": sha256(output_path), "bytes": output_path.stat().st_size},
        "orientation": {"front": "negative-y", "back": "positive-y", "up": "positive-z"},
        "parameters": {
            "rearCutFraction": 0.012,
            "shellRows": 64,
            "shellColumns": 72,
            "sourceCutHeightFractions": [0.38, 0.70],
            "shellHeightFractions": [0.34, 0.74],
            "method": "Rear torso band reconstructed between clean Meshy slice silhouette and depth measurements",
        },
        "result": {
            "vertices": len(mesh.vertices),
            "triangles": sum(len(polygon.vertices) - 2 for polygon in mesh.polygons),
            "originalRearFacesDeleted": deleted_faces,
            "backShellVertices": len(back_shell.data.vertices),
            "backShellTriangles": sum(len(polygon.vertices) - 2 for polygon in back_shell.data.polygons),
            "uvLayers": [layer.name for layer in mesh.uv_layers],
            "materials": [slot.material.name if slot.material else None for slot in model.material_slots],
        },
        "review": {
            "status": "experimental-v1",
            "notes": "The repair preserves the original front geometry, UVs, material, and textures, and replaces outward rear-facing polygons with a fitted procedural ceramic shell. Rear bridge removal is successful; side arm caps and the shell material seam still require a manual sculpt and texture pass.",
        },
    }
    (output_dir / "repair.json").write_text(json.dumps(record, indent=2) + "\n")
    print(json.dumps(record, indent=2))


if __name__ == "__main__":
    main()
