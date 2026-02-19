import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./App.css";
import { MODELS } from "./models";
import { TATTOOS } from "./tattoos";
import { BACKGROUNDS } from "./backgrounds";

const Viewer = lazy(() => import("./components/Viewer"));

function preloadWithLoader(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      () => resolve(),
      undefined,
      () => reject(new Error(`Failed asset: ${url}`)),
    );
  });
}

function App() {
  const [entered, setEntered] = useState(false);
  const [showEnterScreen, setShowEnterScreen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [viewerMounted, setViewerMounted] = useState(false);
  const [awaitingFirstFrame, setAwaitingFirstFrame] = useState(false);
  const [panelClosed, setPanelClosed] = useState(false);
  const [blackDropped, setBlackDropped] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const logsRef = useRef(null);
  const panelRef = useRef(null);
  const dragRef = useRef(null);
  const transitionTimersRef = useRef([]);
  const [panelPos, setPanelPos] = useState(null);

  const clearTransitionTimers = () => {
    transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    transitionTimersRef.current = [];
  };

  useEffect(
    () => () => {
      clearTransitionTimers();
    },
    [],
  );

  useEffect(() => {
    if (!logsRef.current) return;
    logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  useLayoutEffect(() => {
    if (entered || panelPos || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setPanelPos({
      x: Math.max(24, Math.round((window.innerWidth - rect.width) / 2)),
      y: Math.max(24, Math.round((window.innerHeight - rect.height) / 2)),
    });
  }, [entered, panelPos]);

  useEffect(() => {
    const clampIntoViewport = () => {
      if (!panelRef.current || !panelPos) return;
      const rect = panelRef.current.getBoundingClientRect();
      const maxX = Math.max(24, window.innerWidth - rect.width - 24);
      const maxY = Math.max(24, window.innerHeight - rect.height - 24);
      setPanelPos((prev) =>
        prev
          ? {
              x: Math.min(Math.max(prev.x, 24), maxX),
              y: Math.min(Math.max(prev.y, 24), maxY),
            }
          : prev,
      );
    };
    window.addEventListener("resize", clampIntoViewport);
    return () => window.removeEventListener("resize", clampIntoViewport);
  }, [panelPos]);

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!dragRef.current || !panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const maxX = Math.max(24, window.innerWidth - rect.width - 24);
      const maxY = Math.max(24, window.innerHeight - rect.height - 24);
      const x = e.clientX - dragRef.current.offsetX;
      const y = e.clientY - dragRef.current.offsetY;
      setPanelPos({
        x: Math.min(Math.max(x, 24), maxX),
        y: Math.min(Math.max(y, 24), maxY),
      });
    };
    const stopDragging = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
    };
  }, []);

  const handleTitlePointerDown = (e) => {
    if (!panelPos) return;
    e.preventDefault();
    dragRef.current = {
      offsetX: e.clientX - panelPos.x,
      offsetY: e.clientY - panelPos.y,
    };
  };

  const addLog = (message) => {
    const stamp = new Date().toLocaleTimeString("en-GB");
    setLogs((prev) => [...prev, `${stamp}  ${message}`]);
  };

  const startPreload = async () => {
    if (loading) return;
    clearTransitionTimers();
    setLoading(true);
    setViewerMounted(false);
    setAwaitingFirstFrame(false);
    setPanelClosed(false);
    setBlackDropped(false);
    setLogs([]);
    setLoadedCount(0);

    const [three, { OBJLoader }, { RGBELoader }, { useEnvironment, useTexture }, { useLoader }] =
      await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/OBJLoader.js"),
        import("three/examples/jsm/loaders/RGBELoader.js"),
        import("@react-three/drei"),
        import("@react-three/fiber"),
      ]);

    BACKGROUNDS.forEach((b) => {
      if (b.path) useEnvironment.preload({ files: `/bgs/${b.path}` });
    });
    MODELS.forEach((m) => {
      if (m.path) useLoader.preload(OBJLoader, `/models/${m.path}`);
    });
    TATTOOS.forEach((t) => {
      if (t.path) useTexture.preload(`/tattoos/${t.path}`);
    });

    const textureLoader = new three.TextureLoader();
    const objLoader = new OBJLoader();
    const rgbeLoader = new RGBELoader();

    const assets = [
      ...MODELS.filter((m) => m.path).map((m) => ({
        label: `model /models/${m.path}`,
        load: () => preloadWithLoader(objLoader, `/models/${m.path}`),
      })),
      ...TATTOOS.filter((t) => t.path).map((t) => ({
        label: `tattoo /tattoos/${t.path}`,
        load: () => preloadWithLoader(textureLoader, `/tattoos/${t.path}`),
      })),
      ...BACKGROUNDS.filter((b) => b.path).map((b) => ({
        label: `background /bgs/${b.path}`,
        load: () => preloadWithLoader(rgbeLoader, `/bgs/${b.path}`),
      })),
    ];

    setTotalCount(assets.length);
    addLog(`Queue prepared (${assets.length} assets)`);

    try {
      for (let i = 0; i < assets.length; i += 1) {
        const asset = assets[i];
        addLog(`Downloading ${asset.label}...`);
        await asset.load();
        setLoadedCount(i + 1);
        addLog(`Loaded ${asset.label}`);
      }
      addLog("All assets loaded. Rendering first 3D frame...");
      setAwaitingFirstFrame(true);
      setViewerMounted(true);
    } catch (error) {
      addLog(`Error: ${error.message}`);
      addLog("Preload stopped. Press Enter to retry.");
      setLoading(false);
    }
  };

  const handleSceneReady = () => {
    if (!awaitingFirstFrame || entered) return;
    addLog("First 3D frame ready. Entering app...");
    setLoading(false);
    setAwaitingFirstFrame(false);
    setPanelClosed(true);
    const fadeDelayMs = 160;
    const fadeDurationMs = 950;
    const startFadeTimer = window.setTimeout(() => {
      setBlackDropped(true);
    }, fadeDelayMs);
    const snapOffTimer = window.setTimeout(
      () => {
        setEntered(true);
        setShowEnterScreen(false);
      },
      fadeDelayMs + fadeDurationMs,
    );
    transitionTimersRef.current.push(startFadeTimer, snapOffTimer);
  };

  const titleFillProgress =
    totalCount > 0 ? Math.min(1, Math.max(0, loadedCount / totalCount)) : 0;
  const titleFillWidth = titleFillProgress * 100;

  return (
    <>
      {(viewerMounted || entered) && (
        <Suspense fallback={null}>
          <Viewer onSceneReady={handleSceneReady} />
        </Suspense>
      )}
      {showEnterScreen && (
        <div
          className={`enter-screen${panelClosed ? " enter-screen-panel-closed" : ""}${blackDropped ? " enter-screen-bg-drop" : ""}`}
        >
          <div className="enter-screen-back-title-wrap">
            <svg
              className="enter-screen-back-title"
              viewBox="0 -0.4 100 1.8"
              preserveAspectRatio="none"
              aria-hidden
            >
              <g transform="translate(50, 0.755) scale(1, 2.68) translate(-50, -0.5)">
                <text
                  x="50"
                  y="0.5"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="Instrument Serif, serif"
                  fontSize="0.9"
                  textLength="100"
                  lengthAdjust="spacingAndGlyphs"
                  fill="#222"
                >
                  PRINCIPAL SKIN STICKER
                </text>
              </g>
            </svg>
            <div
              className="enter-screen-back-title-progress"
              style={{ "--title-progress": `${titleFillWidth}%` }}
            >
              <svg
                className="enter-screen-back-title"
                viewBox="0 -0.4 100 1.8"
                preserveAspectRatio="none"
                aria-hidden
              >
                <g transform="translate(50, 0.755) scale(1, 2.68) translate(-50, -0.5)">
                  <text
                    x="50"
                    y="0.5"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="Instrument Serif, serif"
                    fontSize="0.9"
                    textLength="100"
                    lengthAdjust="spacingAndGlyphs"
                    fill="#b7ff00"
                  >
                    PRINCIPAL SKIN STICKER
                  </text>
                </g>
              </svg>
            </div>
          </div>
          <div
            ref={panelRef}
            className="enter-screen-content"
            style={
              panelPos
                ? { left: `${panelPos.x}px`, top: `${panelPos.y}px` }
                : undefined
            }
          >
            <div
              className="enter-screen-title"
              onPointerDown={handleTitlePointerDown}
            >
              SKINSTICKER.XYZ
            </div>
            <div className="enter-screen-text">
              Principal Skin Sticker, Tattooer, based on planet Earth. This
              website is a tool for your imagination, select flash designs
              available for character creator /real life. dm on ig to book flash
              or custom, send me ur captures etc
            </div>
            <button
              type="button"
              className="enter-screen-button"
              onClick={startPreload}
              disabled={loading}
            >
              {loading
                ? awaitingFirstFrame
                  ? "Rendering..."
                  : "Loading..."
                : "Enter"}
            </button>
            <div className="enter-screen-progress">
              {loadedCount}/{totalCount || 0}
            </div>
            <div className="enter-screen-logs" aria-live="polite" ref={logsRef}>
              {logs.map((line, index) => (
                <div key={`${line}-${index}`}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
