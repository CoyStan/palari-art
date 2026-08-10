import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import modelUrl from "../../docs/palari-v2/meshy-multiview-pilot/palari-005/output/model.glb?url";
import repairUrl from "../../docs/palari-v2/meshy-multiview-pilot/palari-005/blender-repair/model-repaired.glb?url";

export type ReviewMode = "meshy" | "corrected" | "overlay";
export type CameraView = "Free" | "Front" | "Left" | "Back" | "Right";

export type HybridPalariViewerHandle = {
  resetCamera: (view: CameraView) => void;
};

type Props = {
  mode: ReviewMode;
  autoRotate: boolean;
  onLoadStateChange: (state: "loading" | "ready" | "error") => void;
};

type SceneState = {
  camera: PerspectiveCamera;
  controls: OrbitControls;
  repaired?: Group;
  meshy?: Group;
  meshyMaterials: Map<Mesh, Mesh["material"]>;
  overlayMaterial: MeshBasicMaterial;
  mode: ReviewMode;
};

const cameraPositions: Record<Exclude<CameraView, "Free">, Vector3> = {
  Front: new Vector3(0, 0.2, 9),
  Left: new Vector3(-9, 0.2, 0),
  Back: new Vector3(0, 0.2, -9),
  Right: new Vector3(9, 0.2, 0),
};

function normalizeModel(model: Group, materialMap?: Map<Mesh, Mesh["material"]>) {
  const bounds = new Box3().setFromObject(model);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const scale = 5.4 / size.y;
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -bounds.min.y * scale - 2.55, -center.z * scale);

  model.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
    const cloned = sourceMaterials.map((material) => material.clone());
    object.material = Array.isArray(object.material) ? cloned : cloned[0];
    materialMap?.set(object, object.material);
  });
}

function applyMode(state: SceneState, mode: ReviewMode) {
  state.mode = mode;
  if (state.repaired) state.repaired.visible = mode !== "meshy";
  if (state.meshy) {
    state.meshy.visible = mode !== "corrected";
    state.meshy.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.material = mode === "overlay"
        ? state.overlayMaterial
        : state.meshyMaterials.get(object) ?? object.material;
      object.renderOrder = mode === "overlay" ? 10 : 0;
    });
  }
}

export const HybridPalariViewer = forwardRef<HybridPalariViewerHandle, Props>(function HybridPalariViewer(
  { mode, autoRotate, onLoadStateChange },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<SceneState | null>(null);

  useImperativeHandle(ref, () => ({
    resetCamera(view) {
      const state = stateRef.current;
      if (!state || view === "Free") return;
      state.camera.position.copy(cameraPositions[view]);
      state.controls.target.set(0, 0, 0);
      state.controls.update();
    },
  }), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new Scene();
    scene.background = new Color("#efebe3");
    const camera = new PerspectiveCamera(31, 1, 0.1, 100);
    camera.position.set(4.1, 0.4, 8.1);

    const renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.append(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 6.4;
    controls.maxDistance = 13;
    controls.target.set(0, 0, 0);
    controls.autoRotateSpeed = 1.15;

    scene.add(new AmbientLight("#fffaf0", 2.2));
    const key = new DirectionalLight("#fff7e8", 5.2);
    key.position.set(4.5, 7, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const fill = new DirectionalLight("#bdd5d1", 1.4);
    fill.position.set(-5, 2, 3);
    scene.add(fill);

    const floor = new Mesh(new PlaneGeometry(18, 18), new ShadowMaterial({ color: "#786e5e", opacity: 0.15 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.58;
    floor.receiveShadow = true;
    scene.add(floor);

    const overlayMaterial = new MeshBasicMaterial({
      color: "#2d7186",
      transparent: true,
      opacity: 0.24,
      depthTest: false,
      depthWrite: false,
    });
    const state: SceneState = {
      camera,
      controls,
      meshyMaterials: new Map(),
      overlayMaterial,
      mode,
    };
    stateRef.current = state;
    applyMode(state, mode);

    let frame = 0;
    let disposed = false;
    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    const loader = new GLTFLoader();
    Promise.all([
      loader.loadAsync(modelUrl),
      loader.loadAsync(repairUrl),
    ]).then(([meshyGltf, repairGltf]) => {
      if (disposed) return;
      normalizeModel(meshyGltf.scene, state.meshyMaterials);
      normalizeModel(repairGltf.scene);
      state.meshy = meshyGltf.scene;
      state.repaired = repairGltf.scene;
      scene.add(meshyGltf.scene, repairGltf.scene);
      applyMode(state, state.mode);
      onLoadStateChange("ready");
    }).catch(() => {
      if (!disposed) onLoadStateChange("error");
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      overlayMaterial.dispose();
      renderer.domElement.remove();
      scene.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      stateRef.current = null;
    };
  }, [onLoadStateChange]);

  useEffect(() => {
    if (stateRef.current) applyMode(stateRef.current, mode);
  }, [mode]);

  useEffect(() => {
    if (stateRef.current) stateRef.current.controls.autoRotate = autoRotate;
  }, [autoRotate]);

  return (
    <div
      ref={hostRef}
      className="hybrid-viewer"
      role="img"
      aria-label="Interactive comparison of the original Meshy reconstruction and Blender-repaired Palari 005"
    />
  );
});
