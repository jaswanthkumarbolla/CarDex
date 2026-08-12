import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { CarDexEntry } from "../types";
import { Sliders, Wrench, Shield, Zap, Volume2, Maximize2, Plus, CornerDownRight } from "lucide-react";
import { sfx } from "./ClassicAudio";

interface Interactive3DShowcaseProps {
  presets: CarDexEntry[];
  currentCar: CarDexEntry | null;
  onSelectCar: (car: CarDexEntry) => void;
}

export const Interactive3DShowcase: React.FC<Interactive3DShowcaseProps> = ({
  presets,
  currentCar,
  onSelectCar,
}) => {
  const [selectedCar, setSelectedCar] = useState<CarDexEntry>(presets[0] || {} as CarDexEntry);
  const containerRef = useRef<HTMLDivElement>(null);

  // 3D Hover perspective state for the active showcase card
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Tuner sliders state
  const [rpm, setRpm] = useState(2500); // RPM
  const [wingAngle, setWingAngle] = useState(12); // degrees
  const [suspension, setSuspension] = useState(40); // mm clearance
  const [isRevving, setIsRevving] = useState(false);

  // Audio synthesis loop for real-time motor revving pitch change
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Synchronize internal state with changes from currentCar parent selection
  useEffect(() => {
    if (currentCar) {
      setSelectedCar(currentCar);
    }
  }, [currentCar]);

  // Framer Motion scroll hooks for background parallax & 3D translations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "24%"]);
  const wheelRotation = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const sidePanelX = useTransform(scrollYProgress, [0, 0.5, 1], [40, 0, -40]);

  // Handle 3D MouseMove hover tilt effect math
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    // Output values from -1 to 1 for perspective rotation
    const rX = -(mouseY / (height / 2)); 
    const rY = mouseX / (width / 2);
    setHoverPos({ x: rX, y: rY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    sfx.playClick();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setHoverPos({ x: 0, y: 0 });
  };

  // Motor Synthesizer Engine (Real-time pitches that scale with RPM)
  const startEngineSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Stop any existing oscillator
      stopEngineSound();

      // Create rich engine rumble using sawtooth combined with triangle
      const osc = ctx.createOscillator();
      const waveFilter = ctx.createBiquadFilter();
      const volume = ctx.createGain();

      osc.type = "sawtooth";
      // Map RPM directly to oscillator pitch frequency (e.g., 2500RPM -> ~55Hz, 8500RPM -> ~170Hz)
      const initialFreq = 20 + (rpm / 8500) * 110;
      osc.frequency.setValueAtTime(initialFreq, ctx.currentTime);

      // Low pass filter to make the engine rumble deeply
      waveFilter.type = "lowpass";
      waveFilter.frequency.setValueAtTime(140 + (rpm / 8500) * 800, ctx.currentTime);
      waveFilter.Q.setValueAtTime(4, ctx.currentTime);

      volume.gain.setValueAtTime(0.12, ctx.currentTime);

      osc.connect(waveFilter);
      waveFilter.connect(volume);
      volume.connect(ctx.destination);

      osc.start();
      
      oscillatorRef.current = osc;
      filterRef.current = waveFilter;
      gainRef.current = volume;
      setIsRevving(true);
    } catch (e) {
      console.warn("Audio Context block or init error", e);
    }
  };

  const updateEngineFrequency = (newRpm: number) => {
    if (oscillatorRef.current && filterRef.current && audioContextRef.current) {
      const ctx = audioContextRef.current;
      const targetFreq = 25 + (newRpm / 8500) * 145;
      const targetFilterFreq = 160 + (newRpm / 8500) * 1100;

      // Smooth pitch slide
      oscillatorRef.current.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.05);
      filterRef.current.frequency.setTargetAtTime(targetFilterFreq, ctx.currentTime, 0.05);
    }
  };

  const stopEngineSound = () => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      setIsRevving(false);
    } catch (e) {}
  };

  // Turn off synth engine on component unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }
    };
  }, []);

  // Sync RPM adjustment with sound
  const handleRpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const netRpm = parseInt(e.target.value);
    setRpm(netRpm);
    if (!isRevving) {
      startEngineSound();
    } else {
      updateEngineFrequency(netRpm);
    }
  };

  // Calculated Aerodynamic Metrics
  const calculatedDownforce = Math.round(
    (selectedCar.stats?.horsepower || 300) * 0.45 * (wingAngle / 20) * ( (selectedCar.stats?.topSpeedMph || 150) / 150 )
  );
  
  const estimatedZeroToSixty = Math.max(
    2.2,
    Number(( (selectedCar.stats?.zeroToSixtyS || 4.5) - (wingAngle > 10 ? 0.15 : -0.05) - (suspension < 30 ? 0.2 : 0) ).toFixed(2))
  );

  return (
    <div
      ref={containerRef}
      id="3d-showcase-workbench"
      className="w-full relative mt-16 py-10 overflow-hidden"
    >
      
      {/* 🚀 1. TITLE & SUBTITLE SECTION */}
      <div className="text-center flex flex-col items-center max-w-2xl mx-auto px-4 mb-12">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/30 border border-red-900/40 rounded-full mb-3.5">
          <Wrench className="w-3.5 h-3.5 text-red-500 animate-spin-slow" />
          <span className="text-[9px] font-retro tracking-[0.25em] text-red-400 uppercase">
            3D TUNER STAGE ACTIVE
          </span>
        </div>
        <h2 className="font-retro text-2xl sm:text-4xl tracking-tight uppercase text-white leading-none">
          THE 3D SPEC <span className="text-red-500">HOLODECK</span>
        </h2>
        <p className="text-xs font-mono text-zinc-400 mt-3 leading-relaxed">
          Hover over the holographic telemetry card to tilt it in real 3D. Use the micro-tuner sliders below to rev the engine cylinders and adjust active aerodynamic downforce!
        </p>
      </div>

      {/* 🔮 2. DOUBLE DECK SPLIT: LEFT CINEMATIC 3D PERSPECTIVE CARD, RIGHT WORKBENCH PANEL */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 items-stretch relative">
        
        {/* LEFT DECK (5 Cols): Showcase Card */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center">
          <div
            className="w-full max-w-[360px] aspect-[3/4.6] rounded-2xl bg-zinc-950 border-4 border-zinc-850 p-5 relative shadow-[0_30px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col justify-between"
          >
            
            {/* Holographic grid matrix back layer */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_20%,rgba(0,0,0,0.85)_100%)] z-1" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20 z-1" />
            
            {/* Glass shine reflection overlay */}
            <div
              className="absolute inset-0 opacity-[0.14] pointer-events-none z-10 bg-gradient-to-tr from-transparent via-white to-transparent"
            />

            {/* Glowing active ambient ring */}
            <div
              className="absolute -top-1/4 -left-1/4 w-[160%] h-[160%] bg-gradient-to-tr from-transparent via-red-650/10 to-transparent blur-2xl pointer-events-none z-2"
            />

            {/* TOP CARD DETAILS */}
            <div 
              className="relative z-10 flex justify-between items-start"
            >
              <div>
                <span className="text-[10px] font-retro text-red-500 uppercase tracking-widest block font-bold">
                  #{selectedCar.dexId} • {selectedCar.category}
                </span>
                <h3 className="text-xl font-bold font-sans text-white uppercase tracking-tight mt-1 leading-none">
                  {selectedCar.name}
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 mt-1.5 block tracking-wider uppercase">
                  {selectedCar.brand} • CLASSIC RELEASE
                </span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded text-[9px] font-mono font-bold text-white uppercase shadow-lg">
                {selectedCar.rarity}
              </div>
            </div>

            {/* INTERACTIVE CAR PORTRAIT CONTAINER */}
            <div 
              className="w-full flex-1 min-h-[160px] relative rounded-lg border border-zinc-900 bg-black/40 overflow-hidden my-4 shadow-inner"
            >
              <img
                src={selectedCar.imageUrl}
                alt={selectedCar.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover saturate-110 brightness-95"
              />
              
              {/* Dynamic Suspension Overlay Spacer */}
              <div 
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-900 to-transparent transition-all" 
                style={{ height: `${100 - suspension}%`, opacity: 0.85 }}
              />

              {/* Glowing Scan Bar Line */}
              <motion.div
                animate={{ translateY: ["0%", "450%", "0%"] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-red-500/80 to-transparent pointer-events-none blur-[1px]"
              />
            </div>

            {/* BOTTOM SPECS / LIVE MODS DATA */}
            <div 
              className="relative z-10 grid grid-cols-2 gap-4 border-t border-zinc-900 pt-3"
              style={{ transform: "translateZ(40px)" }}
            >
              <div>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">
                  TUNED SUSPENSION
                </span>
                <span className="text-sm font-bold text-slate-100 font-mono block mt-0.5">
                  {suspension} <span className="text-[10px] text-zinc-500 font-normal">mm</span>
                </span>
              </div>
              <div>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">
                  DOWNFORCE LFT
                </span>
                <span className="text-sm font-bold text-red-500 font-mono block mt-0.5">
                  +{calculatedDownforce} <span className="text-[10px] text-zinc-500 font-normal">lbs</span>
                </span>
              </div>
            </div>

            {/* Small mechanical grid corner decals */}
            <div className="absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-zinc-800" />
            <div className="absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-zinc-800" />
            <div className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-zinc-800" />
            <div className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-zinc-800" />
          </div>
        </div>

        {/* RIGHT DECK (7 Cols): Active 3D Performance Tuner Workbench */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-zinc-950/50 border-4 border-zinc-900 p-6 rounded-2xl relative overflow-hidden backdrop-blur-md">
          
          <div className="absolute top-3 right-4 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">
              Telemetry Synchronized
            </span>
          </div>

          <div>
            <h3 className="text-xs font-retro text-zinc-400 tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 animate-pulse" /> Active Tuning Panel
            </h3>
            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-6">
              Slam the ride height, rev cylinders, and recalibrate aerodynamic balance.
            </p>

            {/* Slider 1: Throttle RPM (Generates customized interactive synth notes!) */}
            <div className="space-y-3 mb-6 bg-black/30 p-4 rounded-xl border border-zinc-900/60 transition-colors">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-red-650" /> Throttle RPM RPM
                </span>
                <span className="font-mono text-xs font-bold text-white px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                  {rpm.toLocaleString()} <span className="text-[10px] text-zinc-500">RPM</span>
                </span>
              </div>
              <input
                type="range"
                min="800"
                max="8500"
                step="50"
                value={rpm}
                onChange={handleRpmChange}
                onMouseUp={stopEngineSound}
                onTouchEnd={stopEngineSound}
                className="w-full accent-red-600 bg-zinc-900 h-1.5 rounded-full outline-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-600 uppercase">
                <span>Idle (800)</span>
                <span>Peak torque (4k)</span>
                <span>Redline (8.5k)</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg border border-zinc-900">
                <div className="flex gap-1">
                  {[...Array(6)].map((_, i) => {
                    const threshold = 1000 + i * 1200;
                    const isActive = rpm >= threshold;
                    return (
                      <div
                        key={i}
                        className={`w-6 h-5 rounded flex items-center justify-center font-retro text-[8px] border transition-all ${
                          isActive
                            ? "bg-red-950/60 border-red-500 text-red-500 led-glow-red font-bold"
                            : "bg-zinc-950 border-zinc-850 text-zinc-700"
                        }`}
                      >
                        CYL
                      </div>
                    );
                  })}
                </div>
                <button
                  onMouseDown={startEngineSound}
                  onMouseUp={stopEngineSound}
                  onTouchStart={startEngineSound}
                  onTouchEnd={stopEngineSound}
                  className="bg-red-650 hover:bg-red-600 active:scale-95 text-white font-retro text-[8.5px] px-3.5 py-2 rounded-lg border border-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Volume2 className="w-3.5 h-3.5" /> HOLD TO REV
                </button>
              </div>
            </div>

            {/* Slider 2: Aero Wing Slider (Changes SVG rotations!) */}
            <div className="space-y-3 mb-6 bg-black/30 p-4 rounded-xl border border-zinc-900/60">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Active Rear Wing Angle
                </span>
                <span className="font-mono text-xs font-bold text-white px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                  {wingAngle}° <span className="text-[10px] text-zinc-500">Angle</span>
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="35"
                step="1"
                value={wingAngle}
                onChange={(e) => {
                  setWingAngle(parseInt(e.target.value));
                  sfx.playClick();
                }}
                className="w-full accent-amber-500 bg-zinc-900 h-1.5 rounded-full outline-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-650 uppercase">
                <span>Low Drag (0°)</span>
                <span>Track Spec (18°)</span>
                <span>High Downforce (35°)</span>
              </div>
            </div>

            {/* Slider 3: Ground Suspension Clearance */}
            <div className="space-y-3 mb-4 bg-black/30 p-4 rounded-xl border border-zinc-900/60">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-sky-500" /> Adjustable Suspension Height
                </span>
                <span className="font-mono text-xs font-bold text-white px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                  {suspension} <span className="text-[10px] text-zinc-500">mm</span>
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="2"
                value={suspension}
                onChange={(e) => {
                  setSuspension(parseInt(e.target.value));
                  sfx.playClick();
                }}
                className="w-full accent-sky-500 bg-zinc-900 h-1.5 rounded-full outline-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-650 uppercase">
                <span>Touge Slammed (10mm)</span>
                <span>Fast Road (45mm)</span>
                <span>Rally Spec (90mm)</span>
              </div>
            </div>

          </div>

          {/* 3. SIMULATED 3D SVG TELEMETRY SCREEN */}
          <div className="bg-black border border-zinc-900 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 mt-2">
            
            {/* Interactive Vector diagram that skews based on values */}
            <div className="w-full md:w-1/3 flex items-center justify-center">
              <svg viewBox="0 0 100 68" className="w-28 h-20 text-zinc-700">
                {/* Simulated ground */}
                <line x1="10" y1="60" x2="90" y2="60" stroke="#27272a" strokeWidth="2" strokeDasharray="3,3" />
                
                {/* 3D Chassis platform that shifts down with suspension */}
                <g transform={`translate(0, ${suspension / 4.4})`}>
                  {/* Chassis outline */}
                  <rect x="25" y="24" width="50" height="14" rx="4" fill="none" stroke="#dc2626" strokeWidth="1.5" />
                  {/* Front/rear bumpers */}
                  <rect x="18" y="28" width="8" height="6" rx="1.5" fill="none" stroke="#dc2626" strokeWidth="1" />
                  <rect x="74" y="28" width="8" height="6" rx="1.5" fill="none" stroke="#dc2626" strokeWidth="1" />
                  
                  {/* Dynamic Active wing spoiler that rotates */}
                  <g transform={`translate(20, 20) rotate(${-wingAngle})`}>
                    <line x1="-12" y1="0" x2="6" y2="-1" stroke="#f59e0b" strokeWidth="2.5" />
                    <line x1="-3" y1="0" x2="-3" y2="7" stroke="#52525b" strokeWidth="1" />
                  </g>
                </g>

                {/* Animated Engine flame or glow based on RPM */}
                {rpm > 4000 && (
                  <path
                    d={`M 88 50 Q ${95 + (rpm/2000)} ${53} 88 ${56} Z`}
                    fill="#f59e0b"
                    className="animate-pulse"
                  />
                )}
              </svg>
            </div>

            {/* Dynamic performance calculations readout */}
            <div className="flex-1 w-full space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-zinc-900 pb-1 text-zinc-400">
                <span>ESTIMATED 0-60 MPH:</span>
                <span className="font-bold text-white">{estimatedZeroToSixty}s</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1 text-zinc-400">
                <span>AERO BALANCE RATIO:</span>
                <span className="font-bold text-amber-500">{(wingAngle / 3.5).toFixed(1)} : 10</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>MAX REVOLUTION LOAD:</span>
                <span className={`font-bold ${rpm > 7000 ? "text-red-500 animate-pulse" : "text-emerald-500"}`}>
                  {(rpm * 1.05).toFixed(0)} kg/m
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 🏎️ 3. HORIZONTAL PRESETS SWITCHING DECK (WITH 3D TRANSLATIONS) */}
      <div className="max-w-6xl mx-auto px-4 mt-16">
        <h3 className="text-xs font-retro text-zinc-400 tracking-[0.2em] mb-4 uppercase">
          Select Chassis Vector
        </h3>
        
        {/* Horizontal Slideable 3D strip of cards */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {presets.map((car) => {
            const isTarget = selectedCar.name === car.name;
            return (
              <button
                key={car.name}
                onClick={() => {
                  sfx.playClick();
                  onSelectCar(car);
                  setSelectedCar(car);
                }}
                className={`flex-shrink-0 w-64 p-3 bg-zinc-950 border-2 rounded-xl text-left transition-all relative overflow-hidden flex items-center gap-3 cursor-pointer ${
                  isTarget
                    ? "border-red-500 shadow-[0_4px_16px_rgba(239,68,68,0.2)] bg-zinc-900/40"
                    : "border-zinc-900 hover:border-zinc-800"
                }`}
              >
                {/* Tiny image */}
                <div className="w-16 h-12 rounded bg-black/60 overflow-hidden relative">
                  <img
                    src={car.imageUrl}
                    alt={car.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
                {/* Details */}
                <div className="flex-1 truncate">
                  <span className="text-[8px] font-retro text-zinc-500 block uppercase">
                    #{car.dexId} • {car.category}
                  </span>
                  <span className="text-xs font-semibold text-zinc-200 uppercase block truncate mt-0.5">
                    {car.name}
                  </span>
                </div>
                {/* Tiny neon status bar */}
                {isTarget && (
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-red-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
