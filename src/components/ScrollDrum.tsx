import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { Scan, Grid, Gamepad2, ArrowDown, Zap } from "lucide-react";
import { sfx } from "./ClassicAudio";

interface ScrollDrumProps {
  onLaunchTab: (tab: "home" | "detector" | "catalog" | "guessingGame") => void;
}

interface PanelData {
  id: "detector" | "catalog" | "guessingGame";
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  accent: string;
  btnLabel: string;
  bgUrl: string;
  icon: React.ComponentType<any>;
}

const PANELS: PanelData[] = [
  {
    id: "detector",
    title: "AI DETECTOR",
    subtitle: "VEHICLE RECOGNITION",
    description: "Upload any car photo to identify its make, model, year, trim, and performance specs instantly.",
    badge: "VISION SCAN",
    accent: "#ef4444", // Bright Crimson Red
    btnLabel: "OPEN SCANNER",
    bgUrl: "bg1.png",
    icon: Scan,
  },
  {
    id: "catalog",
    title: "CAR CATALOG",
    subtitle: "GARAGE SPECIFICATIONS",
    description: "Browse your saved garage catalog. View detailed specs, performance stats, and technical data.",
    badge: "GARAGE VAULT",
    accent: "#ef4444",
    btnLabel: "OPEN CATALOG",
    bgUrl: "catalog.png",
    icon: Grid,
  },
  {
    id: "guessingGame",
    title: "GUESSING GAME",
    subtitle: "TRIVIA & SILHOUETTES",
    description: "Test your car knowledge with trivia and silhouette guessing challenges.",
    badge: "CAR TRIVIA",
    accent: "#ef4444",
    btnLabel: "PLAY GAME",
    bgUrl: "guesser.png",
    icon: Gamepad2,
  },
];

export const ScrollDrum: React.FC<ScrollDrumProps> = ({ onLaunchTab }) => {
  const halfPanel = Math.PI / 3; // 60 degrees, half of the 120 degree panel width
  const slotLength = (Math.PI * 2) / 3; // 120 degrees arc length per segment
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // References for Three.js animation sync
  const targetRotationYRef = useRef(-halfPanel);
  const currentRotationYRef = useRef(-halfPanel);
  const lastInteractionTimeRef = useRef(Date.now());

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Helper to dynamically render canvas textures with site fonts and gorgeous neon HUD graphics
  const drawTextureCanvas = (
    panel: PanelData,
    index: number,
    onComplete: (canvas: HTMLCanvasElement) => void
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 330; // Optimized wider aspect ratio (3.10:1) to prevent stretching/distortion
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw initial high-tech dark slate background
    ctx.fillStyle = "#0c0a09";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.src = panel.bgUrl;

    img.onload = () => {
      // Draw background image preserving 16:9 aspect ratio cover
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      } else {
        drawHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Apply highly contrastive gradient layers to keep HUD labels perfectly readable
      const linearGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      linearGrad.addColorStop(0, "rgba(12, 10, 9, 0.12)");
      linearGrad.addColorStop(0.5, "rgba(12, 10, 9, 0.0)");
      linearGrad.addColorStop(1, "rgba(12, 10, 9, 0.45)");
      ctx.fillStyle = linearGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Tint overlay using standard crimson accents
      ctx.fillStyle = "rgba(239, 68, 68, 0.02)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Futuristic radar tracking grids
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw neon side borders (thin red Fresnel/rim-light highlight representation!)
      // Left edge glow
      const leftGrad = ctx.createLinearGradient(0, 0, 60, 0);
      leftGrad.addColorStop(0, "rgba(239, 68, 68, 0.85)");
      leftGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = leftGrad;
      ctx.fillRect(0, 0, 60, canvas.height);

      // Right edge glow
      const rightGrad = ctx.createLinearGradient(canvas.width, 0, canvas.width - 60, 0);
      rightGrad.addColorStop(0, "rgba(239, 68, 68, 0.85)");
      rightGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rightGrad;
      ctx.fillRect(canvas.width - 60, 0, 60, canvas.height);

      // Solid vertical edge borders
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(2, canvas.height);
      ctx.moveTo(canvas.width - 2, 0);
      ctx.lineTo(canvas.width - 2, canvas.height);
      ctx.stroke();

      // Laser corner target indicators
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      const bracket = 30;
      const pad = 20;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(pad + bracket, pad);
      ctx.lineTo(pad, pad);
      ctx.lineTo(pad, pad + bracket);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(canvas.width - pad - bracket, pad);
      ctx.lineTo(canvas.width - pad, pad);
      ctx.lineTo(canvas.width - pad, pad + bracket);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(pad + bracket, canvas.height - pad);
      ctx.lineTo(pad, canvas.height - pad);
      ctx.lineTo(pad, canvas.height - pad - bracket);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(canvas.width - pad - bracket, canvas.height - pad);
      ctx.lineTo(canvas.width - pad, canvas.height - pad);
      ctx.lineTo(canvas.width - pad, canvas.height - pad - bracket);
      ctx.stroke();

      // Text Title Header Shadow & Stroke
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 1. Large Display Title using standard fallback mono styles for canvas reliability
      ctx.font = "bold 64px 'Share Tech Mono', sans-serif";
      ctx.fillText(panel.title, canvas.width / 2, canvas.height / 2 - 12);

      // 2. Retro Subtitle
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "11px 'Press Start 2P', monospace";
      ctx.fillText(panel.subtitle, canvas.width / 2, canvas.height / 2 + 36);

      // 3. Baked UI badge top-left
      ctx.fillStyle = "rgba(12, 10, 9, 0.85)";
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(42, 32, 260, 32, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ef4444";
      ctx.font = "9px 'Press Start 2P', monospace";
      ctx.textAlign = "left";
      ctx.fillText(panel.badge, 57, 49);

      // 4. Baked indicator on bottom-right corner
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(canvas.width - 240, canvas.height - 64, 190, 36);

      ctx.fillStyle = "#ffffff";
      ctx.font = "9px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillText("VIEW INTERFACE", canvas.width - 145, canvas.height - 46);

      onComplete(canvas);
    };

    img.onerror = () => {
      // Fallback grid texture if Unsplash fails
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 55px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(panel.title, canvas.width / 2, canvas.height / 2);
      onComplete(canvas);
    };
  };

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!canvasRef.current || !scrollContainerRef.current) return;

    // --- THREE.JS INITIALIZATION ---
    const scene = new THREE.Scene();
    
    // Set up transparent background so layout wordmarks behind can show through
    scene.background = null;

    // Camera: reduced FOV to 28 deg and increased distance to 75.0 to flatten the curvature
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
    camera.position.set(0, -1.5, 75.0);
    camera.lookAt(0, -1.5, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Handle initial responsive sizing
    const updateSize = () => {
      if (!canvasRef.current) return;
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      camera.lookAt(0, -1.5, 0); // Keep lookAt aligned
      renderer.setSize(width, height, false);
    };
    updateSize();

    // Main Drum Group wrapper
    const drumGroup = new THREE.Group();
    scene.add(drumGroup);

    // Generate 3 separate Cylinder segments to create a seamless drum (Sleeker Coin-like geometry)
    const radius = 24.0;
    const visibleArcWidth = (100 * Math.PI) / 180; // Widen the visible content coverage to 100 degrees
    const height = 13.5; // Shorter height to achieve a short, wide "coin" shape ratio
    const reflectionY = -1.165 * height;
    const segments = 48;
    const slotLength = (Math.PI * 2) / 3; // 120 degrees arc length per segment

    // Reflection Group placed lower, flipped upside down and faded
    const reflectionGroup = new THREE.Group();
    reflectionGroup.position.y = reflectionY;
    reflectionGroup.scale.set(1, -0.65, 1); // Flipped and squashed reflection
    scene.add(reflectionGroup);

    const materials: THREE.MeshBasicMaterial[] = [];
    const reflectMaterials: THREE.MeshBasicMaterial[] = [];

    PANELS.forEach((panel, i) => {
      const slotCenter = i * slotLength + halfPanel;
      const thetaStart = slotCenter - visibleArcWidth / 2;
      const thetaLength = visibleArcWidth;

      // Cylinder segment geometry
      const geometry = new THREE.CylinderGeometry(
        radius,
        radius,
        height,
        segments,
        1,
        true, // Open-ended
        thetaStart,
        thetaLength
      );

      // Build canvas and canvas texture dynamically
      drawTextureCanvas(panel, i, (canvas) => {
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        // Use MeshBasicMaterial (unlit) to keep 100% of the original vibrant image colors without lighting desaturation/shadowing
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { id: panel.id, index: i };
        drumGroup.add(mesh);
        materials.push(material);

        // Reflection counterpart (has lower opacity and faded alpha mapping)
        const reflectMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.18,
        });

        const reflectMesh = new THREE.Mesh(geometry, reflectMaterial);
        reflectMesh.userData = { id: panel.id, index: i };
        reflectionGroup.add(reflectMesh);
        reflectMaterials.push(reflectMaterial);
      });
    });

    // --- RAYCASTER & INTERACTION (DRAGGING + CLICK TO NAVIGATE) ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isDragging = false;
    let startPointerX = 0;
    let startRotationY = 0;
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const onPointerDown = (event: PointerEvent) => {
      isDragging = true;
      startPointerX = event.clientX;
      startRotationY = targetRotationYRef.current;
      startX = event.clientX;
      startY = event.clientY;
      startTime = Date.now();
      
      // Delay autoplay immediately
      lastInteractionTimeRef.current = Date.now() + 1500;
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!canvasRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        event.preventDefault();
        const deltaX = event.clientX - startPointerX;
        
        // sensitivity: 0.0055 radians per pixel for natural horizontal dragging response
        const sensitivity = 0.0055;
        targetRotationYRef.current = startRotationY + deltaX * sensitivity;
        
        // Keep postponing autoplay during drag
        lastInteractionTimeRef.current = Date.now() + 2500;
        renderer.domElement.style.cursor = "grabbing";
      } else {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([...drumGroup.children, ...reflectionGroup.children]);

        if (intersects.length > 0) {
          renderer.domElement.style.cursor = "pointer";
        } else {
          renderer.domElement.style.cursor = "grab";
        }
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      renderer.domElement.releasePointerCapture(event.pointerId);
      renderer.domElement.style.cursor = "grab";

      const duration = Date.now() - startTime;
      const totalDist = Math.hypot(event.clientX - startX, event.clientY - startY);

      // Postpone autoplay by ~2.5 seconds upon pointer release
      lastInteractionTimeRef.current = Date.now() + 2500;

      // Check distance and click duration to ensure it is a click/tap and not a drag
      if (duration < 350 && totalDist < 5) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([...drumGroup.children, ...reflectionGroup.children]);

        if (intersects.length > 0) {
          const hitMesh = intersects[0].object;
          if (hitMesh.userData && hitMesh.userData.id) {
            sfx.playSuccess();
            onLaunchTab(hitMesh.userData.id);
          }
        }
      } else {
        // Drag released: snap beautifully to nearest panel rotation
        const currentK = Math.round(-(targetRotationYRef.current + halfPanel) / slotLength);
        targetRotationYRef.current = -currentK * slotLength - halfPanel;
      }
    };

    const onPointerLeave = (event: PointerEvent) => {
      if (isDragging) {
        onPointerUp(event);
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("pointerdown", onPointerDown);
    domElement.addEventListener("pointerup", onPointerUp);
    domElement.addEventListener("pointermove", onPointerMove);
    domElement.addEventListener("pointerleave", onPointerLeave);

    // --- ANIMATION RENDER LOOP WITH LERPING SMOOTH CATCH-UP & AUTOPLAY ---
    let animFrameId = 0;
    const activeIndexRef = { current: 0 };

    const animate = () => {
      // Autoplay advance: triggers every 3.5 seconds of idle time
      if (!isDragging && Date.now() - lastInteractionTimeRef.current > 3500) {
        const currentK = Math.round(-(targetRotationYRef.current + halfPanel) / slotLength);
        // Advance clockwise to the next panel snap position
        targetRotationYRef.current = -(currentK + 1) * slotLength - halfPanel;
        lastInteractionTimeRef.current = Date.now();
      }

      // Smooth lerping transition towards the target rotation (drag-adjusted or snapped)
      currentRotationYRef.current += (targetRotationYRef.current - currentRotationYRef.current) * 0.11;
      
      drumGroup.rotation.y = currentRotationYRef.current;
      reflectionGroup.rotation.y = currentRotationYRef.current;

      // Add a slight floating wave to the drum for dynamic organic feel
      const floatTime = Date.now() * 0.0012;
      drumGroup.position.y = Math.sin(floatTime) * 0.08;
      reflectionGroup.position.y = reflectionY - Math.sin(floatTime) * 0.08;

      // Sync active state index by projecting the face that is pointing forward (closest to 0)
      const adjustedRot = currentRotationYRef.current + halfPanel;
      const normalizedRot = ((-adjustedRot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      let closestIdx = 0;
      let minDiff = Infinity;

      for (let idx = 0; idx < 3; idx++) {
        const targetAngle = idx * ((Math.PI * 2) / 3);
        const diff = Math.min(
          Math.abs(normalizedRot - targetAngle),
          Math.abs(normalizedRot - targetAngle + Math.PI * 2),
          Math.abs(normalizedRot - targetAngle - Math.PI * 2)
        );
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      }

      if (closestIdx !== activeIndexRef.current) {
        activeIndexRef.current = closestIdx;
        setActiveIndex(closestIdx);
      }

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Listen to resize events
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }

    // --- LIFECYCLE CLEANUP ---
    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      
      domElement.removeEventListener("pointerdown", onPointerDown);
      domElement.removeEventListener("pointerup", onPointerUp);
      domElement.removeEventListener("pointermove", onPointerMove);
      domElement.removeEventListener("pointerleave", onPointerLeave);

      scene.clear();
      renderer.dispose();

      // Dispose materials & textures safely
      materials.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
      reflectMaterials.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
    };
  }, [prefersReducedMotion]);

  // programmatically snap using the shortest angular path to target index (modulo-correct)
  const snapToPanel = (index: number) => {
    if (prefersReducedMotion) {
      setActiveIndex(index);
      return;
    }
    
    const currentK = Math.round(-(targetRotationYRef.current + halfPanel) / slotLength);
    let diff = ((index - (currentK % 3)) + 3) % 3;
    if (diff > 1.5) diff -= 3; // Choose shortest path direction (-1, 0, or 1)
    
    targetRotationYRef.current = -(currentK + diff) * slotLength - halfPanel;
    lastInteractionTimeRef.current = Date.now() + 2500; // Pause autoplay for 2.5s
  };

  const handleNext = () => {
    if (prefersReducedMotion) {
      setActiveIndex((prev) => (prev + 1) % 3);
      return;
    }
    const currentK = Math.round(-(targetRotationYRef.current + halfPanel) / slotLength);
    targetRotationYRef.current = -(currentK + 1) * slotLength - halfPanel;
    lastInteractionTimeRef.current = Date.now() + 2500; // Pause autoplay for 2.5s
  };

  const handlePrev = () => {
    if (prefersReducedMotion) {
      setActiveIndex((prev) => (prev - 1 + 3) % 3);
      return;
    }
    const currentK = Math.round(-(targetRotationYRef.current + halfPanel) / slotLength);
    targetRotationYRef.current = -(currentK - 1) * slotLength - halfPanel;
    lastInteractionTimeRef.current = Date.now() + 2500; // Pause autoplay for 2.5s
  };

  const currentPanel = PANELS[activeIndex];

  return (
    <div
      ref={scrollContainerRef}
      className="w-full relative min-h-[90vh] flex flex-col items-center justify-start overflow-visible py-4 sm:py-6"
    >
      {/* SCREEN VIEWPORT BLOCK */}
      <div className="relative w-full min-h-[85vh] flex flex-col items-center justify-center overflow-hidden z-10">
        
        {/* LARGE DISPLAY BACKGROUND WORDMARK (Visual background overlay) */}
        <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center select-none pointer-events-none z-0 overflow-hidden">
          <div className="font-brick text-[14vw] sm:text-[15vw] leading-none tracking-tighter text-zinc-950 font-black uppercase text-center select-none opacity-40">
            CAR<span className="text-zinc-900/10">DEX</span>
          </div>
        </div>

        {/* 🎭 THE MAIN 3D CANVAS DRUM / STATIC FALLBACK CONTAINER */}
        <div className="w-[90vw] max-w-6xl h-[52vh] sm:h-[62vh] md:h-[68vh] relative flex items-center justify-center overflow-visible z-10">
          
          {/* Left Navigation Arrow Button */}
          <button
            onClick={handlePrev}
            aria-label="Previous panel"
            className="absolute left-2 sm:left-4 md:left-8 lg:left-12 z-30 cursor-pointer flex items-center justify-center w-11 h-11 bg-zinc-950/95 text-zinc-300 hover:text-red-500 font-mono text-2xl border-2 border-zinc-800 hover:border-red-500 transition-all duration-300 rounded-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.45)] active:scale-95 group focus:outline-none focus:ring-2 focus:ring-red-500 select-none"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            <span className="relative z-10 pb-0.5">‹</span>
          </button>

          {/* Right Navigation Arrow Button */}
          <button
            onClick={handleNext}
            aria-label="Next panel"
            className="absolute right-2 sm:right-4 md:right-8 lg:right-12 z-30 cursor-pointer flex items-center justify-center w-11 h-11 bg-zinc-950/95 text-zinc-300 hover:text-red-500 font-mono text-2xl border-2 border-zinc-800 hover:border-red-500 transition-all duration-300 rounded-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.45)] active:scale-95 group focus:outline-none focus:ring-2 focus:ring-red-500 select-none"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            <span className="relative z-10 pb-0.5">›</span>
          </button>
          
          {prefersReducedMotion ? (
            // static cards layout when reduced motion is preferred
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
              {PANELS.map((panel) => (
                <div
                  key={panel.id}
                  onClick={() => onLaunchTab(panel.id)}
                  className="rounded-2xl border-2 border-zinc-800 bg-zinc-900 p-4 hover:border-red-650 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <panel.icon className="w-5 h-5 text-red-500" />
                    <span className="font-retro text-[10px] text-white font-bold">{panel.title}</span>
                  </div>
                  <p className="text-zinc-400 font-mono text-[11px] leading-relaxed">{panel.description}</p>
                </div>
              ))}
            </div>
          ) : (
            // High fidelity Three.js transparent interactive canvas with touch-none for mobile dragging without scrolling
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-grab touch-none filter drop-shadow-[0_0_35px_rgba(239,68,68,0.15)]"
            />
          )}

          {/* CRT GRID AND SCANLINE NOISE OVERLAYS LAYERED OVER CANVAS */}
          <div className="absolute inset-0 z-15 pointer-events-none border border-zinc-900/20 rounded-3xl overflow-hidden">
            {/* Hologram horizontal line tracker scans */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-10" />
          </div>
        </div>

        {/* LOWER DESCRIPTION BLOCK & CLICKABLE TARGET DOM BUTTONS */}
        <div className="w-full max-w-xl mx-auto px-6 text-center z-20 mt-2 sm:mt-4">
          <div className="min-h-[15vh] flex flex-col justify-between items-center gap-4">
            
            {/* Dynamic text and description block responding to active front-facing panel */}
            <div className="space-y-1.5 sm:space-y-2">
              <span className="font-retro text-[10px] sm:text-xs uppercase font-bold tracking-widest text-red-500 block">
                {currentPanel.title}
              </span>
              <p className="text-[11px] sm:text-xs font-mono text-zinc-300 leading-relaxed bg-zinc-950/80 border border-zinc-900/60 rounded-xl p-3 sm:p-4 backdrop-blur-md shadow-2xl">
                {currentPanel.description}
              </p>
            </div>

            {/* REAL CLICKABLE INTERACTION DOM CTA ACTION BUTTON */}
            <button
              onClick={() => {
                sfx.playSuccess();
                onLaunchTab(currentPanel.id);
              }}
              className="cursor-pointer group flex items-center gap-3 px-6 py-3 border-2 font-retro text-[9px] sm:text-[10px] rounded-xl uppercase tracking-wider transition-all duration-300 bg-red-650 text-white border-red-650 hover:bg-transparent hover:text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transform active:translate-y-0.5"
            >
              <Zap className="w-4 h-4 fill-current animate-pulse text-white group-hover:text-red-500" />
              <span>{currentPanel.btnLabel}</span>
            </button>
          </div>

          {/* Navigation selectors */}
          <div className="flex justify-center items-center gap-2.5 mt-6">
            {PANELS.map((p, idx) => {
              const isActive = activeIndex === idx;
              return (
                <button
                  key={p.id}
                  onClick={() => snapToPanel(idx)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[8.5px] font-retro tracking-widest transition-all uppercase cursor-pointer"
                  style={{
                    borderColor: isActive ? "#ef4444" : "#1c1917",
                    color: isActive ? "#ef4444" : "#78716c",
                    backgroundColor: isActive ? "rgba(239, 68, 68, 0.08)" : "transparent",
                    boxShadow: isActive ? "0 0 10px rgba(239, 68, 68, 0.15)" : "none",
                  }}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-red-500 animate-ping" : "bg-zinc-600"}`}
                  />
                  {p.title.split(" ")[1] || p.title.split(" ")[0]}
                </button>
              );
            })}
          </div>

          {/* Grab/Drag nudge element */}
          <div className="mt-4 flex flex-col items-center gap-1 opacity-40 select-none">
            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">
              SWIPE OR CLICK TO EXPLORE
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
