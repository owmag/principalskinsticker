import { useState, useRef, Suspense, useMemo, useEffect } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  useTexture,
  Decal,
  Environment,
} from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import * as THREE from "three";
import { MODELS } from "../models";
import { TATTOOS } from "../tattoos";
import { BACKGROUNDS } from "../backgrounds";
import { HexColorPicker } from "react-colorful";
import "./Viewer.css";

function Collapsible({
  title,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  className: extraClass,
  headerLeft,
  hideArrow = false,
  headerRight,
  headerNotToggleable = false,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  return (
    <div className={`collapsible${extraClass ? ` ${extraClass}` : ""}`}>
      <div className="collapsible-header">
        {headerLeft && (
          <span className="collapsible-header-left">{headerLeft}</span>
        )}
        <button
          type="button"
          className="collapsible-header-toggle"
          onClick={() => !headerNotToggleable && setOpen(!isOpen)}
        >
          <span>{title}</span>
          {headerRight ||
            (!hideArrow && (
              <span
                className={`collapsible-arrow collapsible-arrow--${isOpen ? "down" : "right"}`}
                aria-hidden
              />
            ))}
        </button>
      </div>
      {isOpen && <div className="collapsible-body">{children}</div>}
    </div>
  );
}

function BodyTypeSelector({ value, options, onChange, open, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  const selected = options.find((o) => o.id === value);

  return (
    <div className="collapsible">
      <button
        type="button"
        className="collapsible-header"
        onClick={() => setOpen(!isOpen)}
      >
        <span>{selected?.name ?? "Body type"}</span>
        <span
          className={`collapsible-arrow collapsible-arrow--${isOpen ? "down" : "right"}`}
          aria-hidden
        />
      </button>
      {isOpen && (
        <div className="collapsible-body">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="body-type-option"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BackgroundSelector({ value, options, onChange, open, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  const selected = options.find((o) => o.id === value);

  return (
    <div className="collapsible">
      <button
        type="button"
        className="collapsible-header"
        onClick={() => setOpen(!isOpen)}
      >
        <span>{selected?.name ?? "Background"}</span>
        <span
          className={`collapsible-arrow collapsible-arrow--${isOpen ? "down" : "right"}`}
          aria-hidden
        />
      </button>
      {isOpen && (
        <div className="collapsible-body">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="body-type-option"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SkinColorSelector({ color, onChange, open, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  return (
    <div className="collapsible">
      <button
        type="button"
        className="collapsible-header skin-color-header"
        onClick={() => setOpen(!isOpen)}
      >
        <span
          className="skin-color-swatch"
          style={{ backgroundColor: color }}
        />
        <span>Colour</span>
        <span
          className={`collapsible-arrow collapsible-arrow--${isOpen ? "down" : "right"}`}
          aria-hidden
        />
      </button>
      {isOpen && (
        <div className="collapsible-body skin-color-body">
          <HexColorPicker
            color={color}
            onChange={onChange}
            className="skin-color-picker"
          />
        </div>
      )}
    </div>
  );
}

function DesignControlPanel({
  tattoo,
  onUpdate,
  onRemove,
  showMove = true,
  showRemove = true,
  moveDisabled = false,
  moveActive = false,
  onMoveClick,
}) {
  return (
    <div className="design-control-panel">
      <div className="control-group">
        <label>Scale</label>
        <input
          type="range"
          min={0.01}
          max={0.4}
          step={0.01}
          value={tattoo.scale}
          onChange={(e) => onUpdate({ scale: parseFloat(e.target.value) })}
        />
      </div>

      <div className="control-group">
        <label className="checkbox-row">
          <span>Mirror flip</span>
          <input
            type="checkbox"
            checked={tattoo.mirror || false}
            onChange={(e) => onUpdate({ mirror: e.target.checked })}
          />
        </label>
      </div>

      <div className="control-group">
        <label>Rotate</label>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={((tattoo.rotation[2] * 180) / Math.PI + 360) % 360}
          onChange={(e) =>
            onUpdate({
              rotation: [
                tattoo.rotation[0],
                tattoo.rotation[1],
                (parseFloat(e.target.value) * Math.PI) / 180,
              ],
            })
          }
        />
      </div>

      <div className="design-actions">
        {showMove && (
          <button
            type="button"
            className={`design-move-btn${moveActive ? " design-move-btn--active" : ""}`}
            disabled={moveDisabled}
            onClick={onMoveClick}
          >
            Move
          </button>
        )}
        {showRemove && (
          <button
            type="button"
            className="design-remove-btn"
            onClick={onRemove}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function Win98Dropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const clickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", clickOutside);
    return () => document.removeEventListener("click", clickOutside);
  }, [open]);

  const selected = options.find((o) => o.id === value);

  return (
    <div className="win98-dropdown" ref={ref}>
      <button
        type="button"
        className="win98-dropdown-trigger"
        onClick={() => setOpen(!open)}
      >
        <span>{selected?.name ?? value}</span>
        <span
          className="win98-dropdown-arrow win98-dropdown-arrow--down"
          aria-hidden
        />
      </button>
      {open && (
        <div className="win98-dropdown-list">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="win98-dropdown-option"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getDesignName(path) {
  if (!path) return "";
  return path.replace(/\.[^.]+$/, "");
}

function BodyModel({
  url,
  tattoos,
  modelRotation = [0, 0, 0],
  placingTattoo,
  onPlacingMove,
  onPlacingCommit,
  movingTattoo,
  onMovingMove,
  onMovingCommit,
  skinColor,
}) {
  const isInteractive = placingTattoo || movingTattoo;
  const previewTattoo = placingTattoo || movingTattoo;
  const obj = useLoader(OBJLoader, url);
  const { meshes, scale, position } = useMemo(() => {
    const cloned = obj.clone();
    const meshList = [];
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.geometry.computeVertexNormals();
        child.updateMatrixWorld();
        const box = new THREE.Box3().setFromObject(child);
        const size = box.getSize(new THREE.Vector3());
        const volume = size.x * size.y * size.z;
        meshList.push({
          geometry: child.geometry,
          matrix: child.matrixWorld.clone(),
          meshIndex: meshList.length,
          volume,
        });
      }
    });
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 1 / maxDim;
    const scaledCenter = center.clone().multiplyScalar(s);
    const rotatedCenter = scaledCenter.applyEuler(
      new THREE.Euler(modelRotation[0], modelRotation[1], modelRotation[2]),
    );
    return {
      meshes: meshList,
      scale: s,
      position: [-rotatedCenter.x, -rotatedCenter.y, -rotatedCenter.z],
    };
  }, [obj, modelRotation]);

  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: skinColor || "#ff69b4",
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide,
      }),
    [skinColor],
  );

  return (
    <group scale={scale} rotation={modelRotation} position={position}>
      {meshes.map((m, i) => (
        <mesh
          key={i}
          geometry={m.geometry}
          material={bodyMaterial}
          matrix={m.matrix}
          matrixAutoUpdate={false}
          onPointerMove={
            isInteractive
              ? (e) => {
                  e.stopPropagation();
                  if (placingTattoo) onPlacingMove?.(e, i);
                  else onMovingMove?.(e, i);
                }
              : undefined
          }
          onPointerUp={
            isInteractive
              ? (e) => {
                  e.stopPropagation();
                  if (placingTattoo) onPlacingCommit?.(e, i);
                  else onMovingCommit?.(e, i);
                }
              : undefined
          }
        >
          {previewTattoo && previewTattoo.meshIndex === i && (
            <Suspense fallback={null}>
              <TattooDecal
                url={`/tattoos/${previewTattoo.path}`}
                path={previewTattoo.path}
                position={previewTattoo.position}
                scale={previewTattoo.scale / scale}
                rotation={previewTattoo.rotation}
                mirror={previewTattoo.mirror}
                opacity={placingTattoo ? 0.45 : 0.45}
              />
            </Suspense>
          )}
          {tattoos
            .filter((t) => t.meshIndex === i)
            .map((t) => (
              <Suspense key={t.id} fallback={null}>
                <TattooDecal
                  url={`/tattoos/${t.path}`}
                  path={t.path}
                  position={t.position}
                  scale={t.scale / scale}
                  rotation={t.rotation}
                  mirror={t.mirror}
                  opacity={1}
                />
              </Suspense>
            ))}
        </mesh>
      ))}
    </group>
  );
}

const DECAL_HEIGHT_FIX = 1.65;
const DECAL_WIDTH_FIX = 1.8;

function TattooDecal({
  url,
  position,
  scale,
  rotation,
  mirror = false,
  opacity = 1,
  path,
}) {
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  const widthFix = [
    "002.png",
    "005.png",
    "007.png",
    "012.png",
    "017.png",
    "018.png",
    "019.png",
    "020.png",
    "023.png",
    "025.png",
  ].includes(path)
    ? DECAL_WIDTH_FIX
    : 1;
  const heightFix = ["001.png", "009.png", "014.png"].includes(path)
    ? DECAL_HEIGHT_FIX
    : 1;
  const scaleVec = Array.isArray(scale)
    ? [...scale]
    : [scale * widthFix, scale * heightFix, scale];
  if (mirror) scaleVec[0] = -Math.abs(scaleVec[0]);
  return (
    <Decal
      position={position}
      rotation={rotation}
      scale={scaleVec}
      map={texture}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

const LOAD_CAMERA = {
  position: [-1, 0, -1.1],
  target: [0, 0.05, 0],
};

const CENTER_CAMERA = {
  position: [0, 0.25, 1.5],
  target: [0, 0.05, 0],
};

function CameraResetter({ resetTrigger, controlsRef }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!resetTrigger || !controlsRef?.current) return;
    camera.position.set(...CENTER_CAMERA.position);
    controlsRef.current.target.set(...CENTER_CAMERA.target);
  }, [resetTrigger, camera, controlsRef]);
  return null;
}

function SceneReadySignal({ onReady }) {
  useEffect(() => {
    if (!onReady) return;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        onReady();
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [onReady]);
  return null;
}

function Scene({
  modelUrl,
  tattoos,
  modelRotation,
  placingTattoo,
  onPlacingMove,
  onPlacingCommit,
  movingTattoo,
  onMovingMove,
  onMovingCommit,
  backgroundPath,
  skinColor,
  cameraResetTrigger,
  onSceneReady,
}) {
  const controlsRef = useRef(null);
  const displayedTattoos = movingTattoo
    ? tattoos.filter((t) => t.id !== movingTattoo.id)
    : tattoos;

  return (
    <>
      <Suspense fallback={null}>
        <Environment files={backgroundPath} background />
        <BodyModel
          url={modelUrl}
          tattoos={displayedTattoos}
          modelRotation={modelRotation}
          placingTattoo={placingTattoo}
          onPlacingMove={onPlacingMove}
          onPlacingCommit={onPlacingCommit}
          movingTattoo={movingTattoo}
          onMovingMove={onMovingMove}
          onMovingCommit={onMovingCommit}
          skinColor={skinColor}
        />
        <SceneReadySignal onReady={onSceneReady} />
      </Suspense>

      <CameraResetter
        resetTrigger={cameraResetTrigger}
        controlsRef={controlsRef}
      />
      <OrbitControls
        ref={controlsRef}
        target={LOAD_CAMERA.target}
        enabled={!placingTattoo && !movingTattoo}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.3}
        maxDistance={500}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

function Viewer({ onSceneReady }) {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedBackground, setSelectedBackground] = useState(
    () => BACKGROUNDS.find((b) => b.id === "sky4k") || BACKGROUNDS[0],
  );
  const [skinColor, setSkinColor] = useState("#a16a5f");
  const [activeTattoos, setActiveTattoos] = useState([]);
  const [placingTattoo, setPlacingTattoo] = useState(null);
  const modelUrl = `/models/${selectedModel.path}`;

  const [designsOpen, setDesignsOpen] = useState(false);
  const [bodyTypeOpen, setBodyTypeOpen] = useState(false);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [openTattooIds, setOpenTattooIds] = useState(new Set());
  const [movingTattoo, setMovingTattoo] = useState(null);
  const [skinColorOpen, setSkinColorOpen] = useState(false);
  const [captures, setCaptures] = useState([]);
  const [cameraResetTrigger, setCameraResetTrigger] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryCapture, setGalleryCapture] = useState(null);
  const canvasWrapRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && movingTattoo) setMovingTattoo(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movingTattoo]);

  const beginPlacingTattoo = (tattoo) => {
    if (!tattoo.path) return;
    setOpenTattooIds(new Set());
    setSkinColorOpen(false);
    setDesignsOpen(false);
    setBodyTypeOpen(false);
    setBackgroundOpen(false);
    setPlacingTattoo({
      sourceId: tattoo.id,
      path: tattoo.path,
      name: getDesignName(tattoo.path),
      position: [0, 0, 0],
      meshIndex: null,
      scale: 0.06,
      rotation: [0, 0, 0],
      mirror: false,
    });
  };

  const getPlacementFromEvent = (e, meshIndex) => {
    const localPoint = e.object.worldToLocal(e.point.clone());
    const normal = e.face?.normal
      ? e.face.normal.clone().normalize()
      : new THREE.Vector3(0, 0, 1);
    if (normal.dot(e.ray.direction) > 0) normal.multiplyScalar(-1);
    const offsetPoint = localPoint.add(normal.clone().multiplyScalar(0.002));
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal,
    );
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    return {
      meshIndex,
      position: offsetPoint.toArray(),
      rotation: [euler.x, euler.y, euler.z],
    };
  };

  const handlePlacingMove = (e, meshIndex) => {
    if (!placingTattoo) return;
    const placement = getPlacementFromEvent(e, meshIndex);
    setPlacingTattoo((prev) => (prev ? { ...prev, ...placement } : prev));
  };

  const updatePlacingTattoo = (updates) => {
    setPlacingTattoo((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const handleMovingMove = (e, meshIndex) => {
    if (!movingTattoo) return;
    const placement = getPlacementFromEvent(e, meshIndex);
    setMovingTattoo((prev) => (prev ? { ...prev, ...placement } : prev));
  };

  const handleMovingCommit = (e, meshIndex) => {
    if (!movingTattoo) return;
    const placement = getPlacementFromEvent(e, meshIndex);
    updateTattoo(movingTattoo.id, {
      meshIndex: placement.meshIndex,
      position: placement.position,
      rotation: placement.rotation,
    });
    setMovingTattoo(null);
  };

  const handlePlacingCommit = (e, meshIndex) => {
    if (!placingTattoo) return;
    const placement = getPlacementFromEvent(e, meshIndex);
    const tattooId = `${placingTattoo.sourceId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setOpenTattooIds(new Set([tattooId]));
    setSkinColorOpen(false);
    setActiveTattoos((prev) => [
      ...prev,
      {
        id: tattooId,
        path: placingTattoo.path,
        name: placingTattoo.name,
        meshIndex: placement.meshIndex,
        position: placement.position,
        scale: placingTattoo.scale,
        rotation: placement.rotation,
        mirror: placingTattoo.mirror || false,
      },
    ]);
    setPlacingTattoo(null);
    setDesignsOpen(false);
  };

  const updateTattoo = (id, updates) => {
    setActiveTattoos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  };

  const downloadCapture = (capture) => {
    const a = document.createElement("a");
    a.href = capture.dataUrl;
    a.download = `capture-${capture.id}.png`;
    a.click();
  };

  const handleCapture = () => {
    const canvas = canvasWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setCaptures((prev) => [
      ...prev,
      {
        id: `capture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        dataUrl,
      },
    ]);
  };

  const removeTattoo = (id) => {
    setMovingTattoo((prev) => (prev?.id === id ? null : prev));
    setOpenTattooIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setActiveTattoos((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="viewer">
      <div className="controls-wrap">
        <div className="controls-scroll-viewport">
          <aside className="controls">
            <BodyTypeSelector
              value={selectedModel.id}
              options={MODELS}
              onChange={(m) => setSelectedModel(m)}
              open={bodyTypeOpen}
              onOpenChange={setBodyTypeOpen}
            />

            <BackgroundSelector
              value={selectedBackground.id}
              options={BACKGROUNDS}
              onChange={(b) => setSelectedBackground(b)}
              open={backgroundOpen}
              onOpenChange={setBackgroundOpen}
            />

            <SkinColorSelector
              color={skinColor}
              onChange={setSkinColor}
              open={skinColorOpen}
              onOpenChange={setSkinColorOpen}
            />

            <Collapsible
              title="Tattoos"
              open={designsOpen}
              onOpenChange={setDesignsOpen}
            >
              <div className="tattoo-grid">
                {TATTOOS.map((tattoo) => (
                  <div
                    key={tattoo.id}
                    className={`tattoo-grid-item ${tattoo.path ? "tattoo-grid-item--clickable" : "tattoo-grid-item--blank"}`}
                    onClick={() => tattoo.path && beginPlacingTattoo(tattoo)}
                  >
                    {tattoo.path ? (
                      <img
                        src={`/tattoos/${tattoo.path}`}
                        alt={tattoo.name}
                        loading="eager"
                        decoding="async"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </Collapsible>

            {activeTattoos.map((tattoo) => (
              <Collapsible
                key={tattoo.id}
                title={tattoo.name}
                className={
                  movingTattoo?.id === tattoo.id ? "panel-active" : undefined
                }
                open={openTattooIds.has(tattoo.id)}
                onOpenChange={(open) => {
                  setOpenTattooIds((prev) => {
                    const next = new Set(prev);
                    if (open) next.add(tattoo.id);
                    else {
                      next.delete(tattoo.id);
                      if (movingTattoo?.id === tattoo.id) setMovingTattoo(null);
                    }
                    return next;
                  });
                }}
                headerLeft={
                  <button
                    type="button"
                    className="collapsible-header-x"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTattoo(tattoo.id);
                    }}
                  >
                    ×
                  </button>
                }
              >
                <DesignControlPanel
                  tattoo={tattoo}
                  onUpdate={(updates) => updateTattoo(tattoo.id, updates)}
                  onRemove={() => removeTattoo(tattoo.id)}
                  showRemove={false}
                  moveDisabled={false}
                  moveActive={movingTattoo?.id === tattoo.id}
                  onMoveClick={() =>
                    setMovingTattoo((prev) =>
                      prev?.id === tattoo.id ? null : { ...tattoo },
                    )
                  }
                />
              </Collapsible>
            ))}
            {placingTattoo && (
              <Collapsible
                key="placing"
                title={placingTattoo.name}
                className="panel-active"
                open={true}
                onOpenChange={(open) => !open && setPlacingTattoo(null)}
                headerLeft={
                  <button
                    type="button"
                    className="collapsible-header-x"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlacingTattoo(null);
                    }}
                  >
                    ×
                  </button>
                }
              >
                <DesignControlPanel
                  tattoo={placingTattoo}
                  onUpdate={updatePlacingTattoo}
                  onRemove={() => setPlacingTattoo(null)}
                  showMove={true}
                  showRemove={false}
                  moveDisabled={true}
                />
              </Collapsible>
            )}
          </aside>
          {galleryCapture && (
            <aside className="controls-gallery">
              <Collapsible
                key="gallery"
                title="Capture"
                hideArrow
                headerNotToggleable
                className="gallery-collapsible"
                headerRight={
                  <button
                    type="button"
                    className="gallery-install-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadCapture(galleryCapture);
                    }}
                    title="Download"
                  >
                    ↓
                  </button>
                }
                open={galleryOpen}
                onOpenChange={(open) => {
                  setGalleryOpen(open);
                  if (!open) setGalleryCapture(null);
                }}
                headerLeft={
                  <button
                    type="button"
                    className="collapsible-header-x"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGalleryOpen(false);
                      setGalleryCapture(null);
                    }}
                  >
                    ×
                  </button>
                }
              >
                <div className="gallery-body">
                  <img src={galleryCapture.dataUrl} alt="Capture" />
                </div>
              </Collapsible>
            </aside>
          )}
        </div>
      </div>

      <div className="canvas-wrap" ref={canvasWrapRef}>
        <Canvas
          camera={{
            position: LOAD_CAMERA.position,
            fov: 45,
          }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <Scene
            modelUrl={modelUrl}
            tattoos={activeTattoos}
            backgroundPath={`/bgs/${selectedBackground.path}`}
            skinColor={skinColor}
            modelRotation={selectedModel.rotation || [0, 0, 0]}
            placingTattoo={placingTattoo}
            onPlacingMove={handlePlacingMove}
            onPlacingCommit={handlePlacingCommit}
            movingTattoo={movingTattoo}
            onMovingMove={handleMovingMove}
            onMovingCommit={handleMovingCommit}
            cameraResetTrigger={cameraResetTrigger}
            onSceneReady={onSceneReady}
          />
        </Canvas>
        <div className="bottom-strip">
          <div className="bottom-buttons-wrap">
            <button
              type="button"
              className="bottom-btn"
              onClick={() => setCameraResetTrigger((t) => t + 1)}
            >
              Center
            </button>
            <button
              type="button"
              className="bottom-btn"
              onClick={handleCapture}
            >
              Capture
            </button>
            <a
              href="https://www.instagram.com/principalskinsticker/"
              target="_blank"
              rel="noopener noreferrer"
              className="bottom-btn"
            >
              Book now
            </a>
          </div>
          {captures.length > 0 && (
            <div className="captures-scroll-wrap">
              <div className="captures-grid">
                {captures.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="capture-thumb"
                    onClick={() => {
                      setGalleryCapture(c);
                      setGalleryOpen(true);
                    }}
                  >
                    <img src={c.dataUrl} alt="Capture" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="view-controls-help">
          {(placingTattoo || movingTattoo) && (
            <div className="placement-hint">
              {placingTattoo
                ? `Placing ${placingTattoo.name}: click on body to place`
                : `Moving ${movingTattoo.name}: click on body to place or press "move" to cancel`}
            </div>
          )}
          <div>Pinch — zoom</div>
          <div>Drag — orbit</div>
          <div>Two-finger Drag — pan</div>
        </div>
      </div>
    </div>
  );
}

export default Viewer;
