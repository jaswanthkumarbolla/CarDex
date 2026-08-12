import React, { useRef, useState } from "react";
import { CarDexEntry } from "../types";
import { Camera, Search, Upload, RefreshCw, AlertTriangle, ArrowRight } from "lucide-react";
import { sfx } from "./ClassicAudio";

interface LeftPanelProps {
  currentCar: CarDexEntry | null;
  historyList: CarDexEntry[];
  loading: boolean;
  onSearch: (carName: string) => void;
  onScanImage: (base64: string, mimeType: string) => void;
  onSelectCar: (car: CarDexEntry) => void;
  onNextCar: () => void;
  onPrevCar: () => void;
}

export const PokedexLeftPanel: React.FC<LeftPanelProps> = ({
  currentCar,
  historyList,
  loading,
  onSearch,
  onScanImage,
  onSelectCar,
  onNextCar,
  onPrevCar,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim() || loading) return;
    sfx.playScan();
    onSearch(searchInput);
  };

  // Convert uploaded image file to Base64
  const handleImageFile = (file: File) => {
    if (!file) return;
    sfx.playScan();
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onScanImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  // Sample simulation for users without immediate files
  const triggerSimulation = (carName: string) => {
    sfx.playScan();
    onSearch(carName);
  };

  return (
    <div id="pokedex-left-panel" className="w-full lg:w-1/2 bg-red-600 rounded-3xl border-8 border-red-800 shadow-2xl p-6 flex flex-col relative overflow-hidden">
      {/* Glossy top bevel border highlight */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-white/10 rounded-t-xl" />

      {/* --- TOP STATUS INDICATORS --- */}
      <div className="flex items-center gap-4 mb-4 border-b-4 border-red-800 pb-4 relative z-10">
        {/* Large Blue Camera / Lens Indicator */}
        <div 
          onClick={() => sfx.playSuccess()}
          className="relative cursor-pointer w-16 h-16 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center shadow-md select-none active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-sky-500 led-glow-blue flex items-center justify-center relative overflow-hidden">
            <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-white/40" />
            <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-white/20" />
            <div className="w-4 h-4 rounded-full bg-sky-300" />
          </div>
        </div>

        {/* Small Flashing LED lights: Red, Yellow, Green */}
        <div className="flex gap-2.5">
          <div className={`w-4 h-4 rounded-full border border-slate-900 shadow-md ${loading ? "bg-red-500 led-glow-red animate-pulse" : "bg-red-800"}`} />
          <div className={`w-4 h-4 rounded-full border border-slate-900 shadow-md ${loading ? "bg-yellow-500 led-glow-yellow animate-bounce" : "bg-yellow-800"}`} />
          <div className={`w-4 h-4 rounded-full border border-slate-900 shadow-md ${!loading ? "bg-green-500 led-glow-green" : "bg-green-900 animate-pulse"}`} />
        </div>

        {/* Diagonal chassis detail wire lines */}
        <div className="ml-auto opacity-30 pointer-events-none">
          <div className="w-24 h-1.5 bg-red-950 mb-1 rounded" />
          <div className="w-16 h-1.5 bg-red-950 rounded" />
        </div>
      </div>

      {/* --- RETRO POKEDEX VIEWPORT (CRT SCREEN) --- */}
      <div className="bg-slate-300 rounded-2xl border-4 border-slate-400 p-4 aspect-[4/3] flex flex-col items-center justify-center relative shadow-inner">
        {/* Dual blinking green lights on metallic trim */}
        <div className="flex justify-center gap-6 absolute -top-1 w-full left-0">
          <div className="w-2.5 h-1.5 bg-red-500 rounded-b-sm border-x border-slate-500" />
          <div className="w-2.5 h-1.5 bg-red-500 rounded-b-sm border-x border-slate-500" />
        </div>

        {/* The screen proper */}
        <div className="w-full h-full bg-neutral-950 border-4 border-neutral-800 rounded-lg crt-screen p-3 flex flex-col justify-between relative overflow-hidden">
          {/* Scan overlay grid */}
          {loading && (
            <div className="absolute inset-0 bg-sky-950/20 z-20 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-12 h-12 border-4 border-sky-400 rounded-full border-t-transparent animate-spin" />
              <p className="mt-3 text-sky-400 font-retro text-[9px] tracking-wide text-center uppercase animate-pulse">
                SCANNIN' DATACORE...
              </p>
            </div>
          )}

          {/* Core Display Content */}
          {currentCar ? (
            <div className="w-full h-full flex flex-col justify-between relative z-10 transition-all">
              {/* Screen Header Badge */}
              <div className="flex justify-between items-center bg-black/60 px-2 py-1 rounded border border-neutral-700 font-mono">
                <span className="text-red-500 font-retro text-[9px]">
                  ID #{currentCar.dexId}
                </span>
                <span className="text-[10px] text-zinc-400 tracking-wider font-bold">
                  MODEL SPEC INDEX
                </span>
              </div>

              {/* Central Dynamic Image */}
              <div className="flex-1 my-2 relative overflow-hidden rounded border border-neutral-800 bg-neutral-900 group">
                <img
                  src={currentCar.imageUrl}
                  alt={`${currentCar.brand} ${currentCar.name}`}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover select-none transition-all duration-300 ${loading ? "scale-95 brightness-50 contrast-125" : "scale-100 filter brightness-90 saturate-125"}`}
                />
                
                {/* Vintage Hologram / Alignment Reticle */}
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-sky-400/30 pointer-events-none" />
                <div className="absolute inset-y-0 left-1/2 w-0.5 bg-sky-400/30 pointer-events-none" />
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-sky-400 opacity-60" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-sky-400 opacity-60" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-sky-400 opacity-60" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-sky-400 opacity-60" />

                {/* Pixelated Categorization overlay */}
                <div className="absolute bottom-1 right-1 bg-red-600/90 text-[9px] font-retro text-white px-2 py-0.5 rounded capitalize">
                  {currentCar.category}
                </div>
              </div>

              {/* Screen Footer Brand Name Tag */}
              <div className="bg-emerald-950/80 border border-emerald-500/30 rounded p-1.5 flex flex-col leading-tight">
                <p className="text-[11px] text-emerald-400 font-retro uppercase tracking-wider truncate">
                  {currentCar.brand} {currentCar.name}
                </p>
                <div className="flex justify-between items-center text-[10px] text-emerald-500 font-mono font-medium">
                  <span>RELEASED: {currentCar.year}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-widest">
                    {currentCar.rarity}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-center items-center text-center p-4">
              <RefreshCw className="w-10 h-10 text-rose-500 animate-spin mb-3" />
              <p className="text-rose-500 font-retro text-[10px] tracking-wide uppercase mb-1">
                SYSTEM STANDBY
              </p>
              <p className="text-zinc-500 text-xs font-mono">
                Scan photos or enter queries in the console below to populate the active automotive database.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- PHYSICAL CONTROLLERS & CONTROLS --- */}
      <div className="mt-4 grid grid-cols-12 gap-2 items-center">
        {/* Directional D-pad controller */}
        <div className="col-span-4 flex justify-center items-center relative py-2">
          <div className="relative w-24 h-24 select-none">
            {/* The Black D-Pad body */}
            <div className="absolute inset-0 m-auto w-8 h-24 bg-neutral-800 rounded border-y-2 border-neutral-950 shadow-lg" />
            <div className="absolute inset-0 m-auto w-24 h-8 bg-neutral-800 rounded border-x-2 border-neutral-950 shadow-lg" />
            {/* Center core */}
            <div className="absolute inset-0 m-auto w-8 h-8 bg-neutral-900 rounded-full border border-neutral-700" />

            {/* UP BUTTON - cycles previous */}
            <button 
              id="dpad-up"
              onClick={() => { sfx.playClick(); onPrevCar(); }}
              className="absolute top-0 inset-x-0 mx-auto w-8 h-8 rounded-t bg-neutral-800 active:bg-neutral-950 flex items-center justify-center border-t border-neutral-600 focus:outline-none cursor-pointer"
              title="Previous Entry"
            >
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-transparent border-b-zinc-400" />
            </button>

            {/* DOWN BUTTON - cycles next */}
            <button 
              id="dpad-down"
              onClick={() => { sfx.playClick(); onNextCar(); }}
              className="absolute bottom-0 inset-x-0 mx-auto w-8 h-8 rounded-b bg-neutral-800 active:bg-neutral-950 flex items-center justify-center border-b border-neutral-900 focus:outline-none cursor-pointer"
              title="Next Entry"
            >
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-zinc-400" />
            </button>

            {/* LEFT BUTTON - cycles previous */}
            <button 
              id="dpad-left"
              onClick={() => { sfx.playClick(); onPrevCar(); }}
              className="absolute left-0 inset-y-0 my-auto w-8 h-8 rounded-l bg-neutral-800 active:bg-neutral-950 flex items-center justify-center border-l border-neutral-600 focus:outline-none cursor-pointer"
              title="Previous"
            >
              <div className="w-0 h-0 border-t-4 border-b-4 border-r-6 border-transparent border-r-zinc-400" />
            </button>

            {/* RIGHT BUTTON - cycles next */}
            <button 
              id="dpad-right"
              onClick={() => { sfx.playClick(); onNextCar(); }}
              className="absolute right-0 inset-y-0 my-auto w-8 h-8 rounded-r bg-neutral-800 active:bg-neutral-950 flex items-center justify-center border-r border-neutral-900 focus:outline-none cursor-pointer"
              title="Next"
            >
              <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-zinc-400" />
            </button>
          </div>
        </div>

        {/* Small Yellow & Orange Auxiliary Keypad */}
        <div className="col-span-3 flex flex-col justify-center gap-3 pl-2">
          {/* Black horizontal slots */}
          <div className="flex gap-2.5">
            <div className="w-10 h-2 bg-neutral-950 rounded shadow-inner" />
            <div className="w-10 h-2 bg-neutral-950 rounded shadow-inner" />
          </div>
          {/* Action buttons */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <button 
                onClick={() => { sfx.playSuccess(); alert("CarDex Version 1.15 online - System active."); }}
                className="w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-700 shadow flex items-center justify-center active:bg-slate-950 focus:outline-none cursor-pointer press-sfx text-[10px] text-rose-500 font-bold"
              >
                A
              </button>
              <span className="text-[8px] font-retro text-red-950 mt-1 uppercase">SysInfo</span>
            </div>
            <div className="flex flex-col items-center">
              <button 
                onClick={() => { sfx.playClick(); setSearchInput(""); }}
                className="w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-700 shadow flex items-center justify-center active:bg-slate-950 focus:outline-none cursor-pointer press-sfx text-[10px] text-zinc-400 font-bold"
              >
                B
              </button>
              <span className="text-[8px] font-retro text-red-950 mt-1 uppercase">Clear</span>
            </div>
          </div>
        </div>

        {/* Dynamic scanning upload camera grid */}
        <div className="col-span-5">
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-24 border-3 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-all ${
              dragActive 
                ? "bg-emerald-950/40 border-emerald-400 text-emerald-400" 
                : "bg-red-700/60 border-red-900 hover:bg-red-800/80 hover:border-red-950 text-white"
            }`}
            title="Drag & drop any car picture here, or click to capture camera view!"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            {dragActive ? (
              <>
                <Upload className="w-6 h-6 animate-bounce text-emerald-400" />
                <span className="text-[10px] font-retro mt-1 animate-pulse uppercase">RELEASE FILE!</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 text-white mb-1" />
                <span className="text-[10px] font-retro tracking-tight uppercase">CAR SCANNER</span>
                <span className="text-[9px] font-mono text-white/70 italic leading-none mt-0.5">Drag Photo or Click</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- DASHBOARD ENTRY PORTAL (SEARCH BOX) --- */}
      <div className="mt-4 bg-zinc-950 rounded-xl border-4 border-red-800 p-3 shadow-inner">
        <label className="block text-[10px] font-retro text-red-500 mb-1.5 uppercase">
          COMM-LINK SEARCH TERMINAL
        </label>
        
        <form onSubmit={handleSubmitSearch} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5">
              <Search className="h-4 w-4 text-zinc-500" />
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. Mazda RX-7 1997 or Mustang..."
              className="w-full text-zinc-200 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 pl-9 text-xs font-mono focus:outline-none focus:border-red-500 placeholder-zinc-600 uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchInput.trim()}
            className={`cursor-pointer px-4 py-1.5 text-xs font-retro tracking-widest text-white rounded transition-colors uppercase border ${
              loading || !searchInput.trim()
                ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                : "bg-red-700 hover:bg-red-800 border-red-600 active:scale-95"
            }`}
          >
            SCAN
          </button>
        </form>

        {/* Convenient quick simulator suggestions */}
        <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
          <span className="text-[9px] font-retro text-zinc-600 mr-1 uppercase">SAMPLES:</span>
          <button 
            type="button"
            onClick={() => triggerSimulation("1997 Toyota Supra MK4")}
            className="cursor-pointer bg-zinc-900 hover:bg-neutral-800 text-[10px] text-zinc-400 font-mono px-2 py-0.5 rounded border border-zinc-800 active:scale-95 uppercase"
          >
            Supra MK4
          </button>
          <button 
            type="button"
            onClick={() => triggerSimulation("1967 Eleanor Shelby GT500")}
            className="cursor-pointer bg-zinc-900 hover:bg-neutral-800 text-[10px] text-zinc-400 font-mono px-2 py-0.5 rounded border border-zinc-800 active:scale-95 uppercase"
          >
            Shelby GT500
          </button>
          <button 
            type="button"
            onClick={() => triggerSimulation("1995 Honda NSX Type-R")}
            className="cursor-pointer bg-zinc-900 hover:bg-neutral-800 text-[10px] text-zinc-400 font-mono px-2 py-0.5 rounded border border-zinc-800 active:scale-95 uppercase"
          >
            NSX-R
          </button>
        </div>
      </div>
    </div>
  );
};
