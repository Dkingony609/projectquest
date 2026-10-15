import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  loadHumanLibrary,
  type HumanAppearance,
  type HumanBody,
  type HumanCharacter,
  type HumanLibrary,
} from "../world/humans";
import "./character-preview.css";

interface CharacterPreviewProps {
  appearance: HumanAppearance & { body?: HumanBody };
  reducedMotion?: boolean;
}

type PreviewView = "body" | "face" | "hands";

interface PreviewRuntime {
  library: HumanLibrary | null;
  character: HumanCharacter | null;
  scene: THREE.Scene;
  yaw: number;
  draw: () => void;
}

/** A real, animated instance of the same rigged human used in the workplace. */
export default function CharacterPreview({
  appearance,
  reducedMotion = false,
}: CharacterPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<PreviewRuntime | null>(null);
  const appearanceRef = useRef(appearance);
  const reducedMotionRef = useRef(reducedMotion);
  const viewRef = useRef<PreviewView>("body");
  const [view, setView] = useState<PreviewView>("body");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    appearanceRef.current = appearance;
    const runtime = runtimeRef.current;
    if (!runtime?.library || !runtime.character) return;
    const body = appearance.body ?? "male";
    if (runtime.character.getDiagnostics().body !== body) {
      // Share the loaded geometry/textures, with a fresh skeleton for each body.
      try {
        const replacement = runtime.library.create({
          id: "character-preview",
          body,
          appearance,
          outfit: "office",
          height: 1.75,
        });
        runtime.character.dispose();
        runtime.character = replacement;
        runtime.scene.add(replacement.group);
      } catch {
        setStatus("error");
        return;
      }
    } else runtime.character.setAppearance(appearance);
    runtime.character.group.rotation.y = runtime.yaw;
    runtime.draw();
  }, [appearance]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    viewRef.current = view;
    runtimeRef.current?.draw();
  }, [view]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let frame = 0;
    let previousTime = 0;
    let previousDraw = 0;
    let renderer: THREE.WebGLRenderer | undefined;
    let observer: ResizeObserver | undefined;
    let pointerId: number | null = null;
    let pointerX = 0;
    const controller = new AbortController();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e8e9e4");
    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 30);
    const floorGeometry = new THREE.CircleGeometry(3, 64);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: "#d7dcd5",
      roughness: 1,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.015;
    scene.add(floor);
    const contactGeometry = new THREE.CircleGeometry(0.33, 48);
    const contactMaterial = new THREE.MeshBasicMaterial({
      color: "#34483f",
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
    });
    const contact = new THREE.Mesh(contactGeometry, contactMaterial);
    contact.rotation.x = -Math.PI / 2;
    contact.scale.set(1, 0.65, 1);
    contact.position.y = -0.012;
    scene.add(contact);
    scene.add(new THREE.HemisphereLight("#ffffff", "#c3c8b6", 2.0));
    const key = new THREE.DirectionalLight("#fff6e7", 2.5);
    key.position.set(-2.5, 4, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight("#e8f3ff", 1.2);
    fill.position.set(3, 2, 1.5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight("#ffffff", 2.0);
    rim.position.set(1, 3.5, -3);
    scene.add(rim);

    const draw = () => {
      if (disposed || !renderer) return;
      const selectedView = viewRef.current;
      const target = selectedView === "face" ? 1.57 : selectedView === "hands" ? 0.95 : 0.88;
      const distance = selectedView === "face" ? 1.12 : selectedView === "hands" ? 1.75 : 3.65;
      // Preserve the entire silhouette even on narrow mobile screens.
      const fit = selectedView === "body" ? Math.max(1, 0.65 / camera.aspect) : 1;
      camera.position.set(0, target + 0.055, distance * fit);
      camera.lookAt(0, target, 0);
      renderer.render(scene, camera);
      const diagnostics = runtimeRef.current?.character?.getDiagnostics();
      if (diagnostics) {
        host.dataset.body = diagnostics.body;
        host.dataset.skinnedMeshes = String(diagnostics.skinnedMeshCount);
        host.dataset.bones = String(diagnostics.boneCount);
        host.dataset.mixerTime = diagnostics.mixerTime.toFixed(3);
        host.dataset.animation = diagnostics.currentAnimation;
      }
    };
    const runtime: PreviewRuntime = { library: null, character: null, scene, yaw: -0.14, draw };
    runtimeRef.current = runtime;
    const onContextLost = (event: Event) => {
      event.preventDefault();
      if (!disposed) {
        cancelAnimationFrame(frame);
        setStatus("error");
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      pointerId = event.pointerId;
      pointerX = event.clientX;
      renderer?.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId || !runtime.character) return;
      runtime.yaw += (event.clientX - pointerX) * 0.012;
      pointerX = event.clientX;
      runtime.character.group.rotation.y = runtime.yaw;
      draw();
    };
    const onPointerUp = () => {
      pointerId = null;
    };

    const animate = (time: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (document.hidden) {
        previousTime = time;
        return;
      }
      if (!runtime.character || reducedMotionRef.current) {
        // The existing frame is complete. Controls and resizes still draw once.
        previousTime = time;
        return;
      }
      // Limit this small studio view to 30 fps, including software-rendered browsers.
      if (time - previousDraw < 1000 / 30) return;
      const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.1) : 0;
      previousTime = time;
      previousDraw = time;
      runtime.character?.update(dt, 0, reducedMotionRef.current);
      draw();
    };

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.addEventListener("webglcontextlost", onContextLost);
      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointermove", onPointerMove);
      renderer.domElement.addEventListener("pointerup", onPointerUp);
      renderer.domElement.addEventListener("pointercancel", onPointerUp);
      host.appendChild(renderer.domElement);
      const resize = () => {
        if (!renderer || disposed) return;
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        draw();
      };
      observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();
      frame = requestAnimationFrame(animate);
      void loadHumanLibrary({ signal: controller.signal })
        .then((library) => {
          if (disposed) {
            library.dispose();
            return;
          }
          runtime.library = library;
          runtime.character = library.create({
            id: "character-preview",
            body: appearanceRef.current.body ?? "male",
            appearance: appearanceRef.current,
            outfit: "office",
            height: 1.75,
          });
          runtime.character.group.rotation.y = runtime.yaw;
          scene.add(runtime.character.group);
          draw();
          setStatus("ready");
        })
        .catch(() => {
          if (!disposed) {
            runtime.character?.dispose();
            runtime.library?.dispose();
            runtime.character = null;
            runtime.library = null;
            setStatus("error");
          }
        });
    } catch {
      // Character setup remains available when this browser cannot render 3D.
      queueMicrotask(() => {
        if (!disposed) setStatus("error");
      });
    }

    return () => {
      disposed = true;
      controller.abort();
      cancelAnimationFrame(frame);
      observer?.disconnect();
      runtime.character?.dispose();
      runtime.library?.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      contactGeometry.dispose();
      contactMaterial.dispose();
      scene.clear();
      if (renderer) {
        renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer.domElement.removeEventListener("pointermove", onPointerMove);
        renderer.domElement.removeEventListener("pointerup", onPointerUp);
        renderer.domElement.removeEventListener("pointercancel", onPointerUp);
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      }
      if (runtimeRef.current === runtime) runtimeRef.current = null;
    };
  }, [attempt]);

  const rotate = (direction: number) => {
    const runtime = runtimeRef.current;
    if (!runtime?.character) return;
    runtime.yaw += direction * Math.PI / 6;
    runtime.character.group.rotation.y = runtime.yaw;
    runtime.draw();
  };

  return (
    <figure className="character-preview" aria-label="Your customised 3D character">
      <div
        ref={hostRef}
        className="character-preview-stage"
        data-testid="character-preview"
        data-status={status}
        data-view={view}
        role="img"
        aria-label={`Your ${appearance.body ?? "male"} character, ${view === "body" ? "full body" : view} view`}
      />
      {status === "loading" && (
        <div className="character-preview-message" role="status">
          <span className="character-preview-spinner" aria-hidden="true" />
          Getting your character ready…
        </div>
      )}
      {status === "error" && (
        <div className="character-preview-message" role="status">
          <p>The character preview couldn’t load.</p>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setStatus("loading");
              setAttempt((current) => current + 1);
            }}
          >
            Try preview again
          </button>
        </div>
      )}
      <figcaption className="character-preview-controls">
        <div className="character-preview-views" role="group" aria-label="Character view">
          {(["body", "face", "hands"] as const).map((option) => (
            <button
              type="button"
              key={option}
              aria-pressed={view === option}
              disabled={status !== "ready"}
              onClick={() => setView(option)}
            >
              {option === "body" ? "Full body" : option === "face" ? "Face" : "Hands"}
            </button>
          ))}
        </div>
        <div className="character-preview-rotation" role="group" aria-label="Turn character">
          <button type="button" aria-label="Rotate character left" disabled={status !== "ready"} onClick={() => rotate(-1)}>↶</button>
          <button type="button" aria-label="Rotate character right" disabled={status !== "ready"} onClick={() => rotate(1)}>↷</button>
        </div>
      </figcaption>
      <p className="character-preview-hint">Drag to turn · Take a closer look</p>
    </figure>
  );
}
