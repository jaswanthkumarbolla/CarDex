import React, { useState } from "react";
import { CarDexEntry } from "../types";
import { 
  Wrench, 
  Trophy, 
  Gauge, 
  MapPin, 
  CheckSquare, 
  Square, 
  Compass, 
  Activity, 
  HelpCircle,
  FolderOpen
} from "lucide-react";
import { sfx } from "./ClassicAudio";

interface RightPanelProps {
  currentCar: CarDexEntry | null;
  presets: CarDexEntry[];
  onSelectCar: (car: CarDexEntry) => void;
  onToggleIssue: (issueId: string) => void;
}

type TabType = "specs" | "restoration" | "history";

export const PokedexRightPanel: React.FC<RightPanelProps> = ({
  currentCar,
  presets,
  onSelectCar,
  onToggleIssue,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("specs");

  if (!currentCar) {
    return (
      <div id="pokedex-right-panel" className="w-full lg:w-1/2 bg-red-600 rounded-3xl border-8 border-red-800 shadow-2xl p-6 flex items-center justify-center min-h-[500px]">
        <div className="text-center text-white/50 font-retro">
          <p className="animate-pulse uppercase text-xs">Waiting for Scanner Uplink...</p>
        </div>
      </div>
    );
  }

  // Calculate some fun gaming specs
  const hpToWeightRatio = (currentCar.stats.horsepower !== null && currentCar.stats.weightLbs !== null && currentCar.stats.weightLbs > 0)
    ? (currentCar.stats.horsepower / (currentCar.stats.weightLbs / 1000)).toFixed(1)
    : "N/A";
  const restoreDifficultyPercent = currentCar.restoration.difficultyRating;

  // Render a responsive, clean, modern custom SVG performance graph relative to standard baselines
  const statsScaleMax = {
    topSpeedMph: 250,
    zeroToSixtyS: 12, // smaller is better
    horsepower: 600,
    torqueLbFt: 600
  };

  const speedWidth = currentCar.stats.topSpeedMph ? Math.min(100, (currentCar.stats.topSpeedMph / statsScaleMax.topSpeedMph) * 100) : 0;
  const accelWidth = currentCar.stats.zeroToSixtyS ? Math.min(100, ((statsScaleMax.zeroToSixtyS - currentCar.stats.zeroToSixtyS) / statsScaleMax.zeroToSixtyS) * 100) : 0;
  const hpWidth = currentCar.stats.horsepower ? Math.min(100, (currentCar.stats.horsepower / statsScaleMax.horsepower) * 100) : 0;
  const torqueWidth = currentCar.stats.torqueLbFt ? Math.min(100, (currentCar.stats.torqueLbFt / statsScaleMax.torqueLbFt) * 100) : 0;

  const handleTabChange = (tab: TabType) => {
    sfx.playClick();
    setActiveTab(tab);
  };

  return (
    <div id="pokedex-right-panel" className="w-full lg:w-1/2 bg-red-600 rounded-3xl border-8 border-red-800 shadow-2xl p-6 flex flex-col relative overflow-hidden">
      {/* Glossy top bevel border highlight */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-white/10 rounded-t-xl" />

      {/* --- TOP LCD GRN MATRIX PANEL (TELEMETRY OVERVIEW) --- */}
      <div className="bg-emerald-900 border-4 border-slate-900 rounded-2xl p-4 shadow-inner mb-4">
        <div className="grid grid-cols-2 gap-3 text-emerald-400 font-mono text-[11px] leading-tight select-none">
          {/* Top Left box: Core Physical metrics */}
          <div className="border border-emerald-500/30 rounded p-2 bg-black/40">
            <p className="text-emerald-500 font-bold uppercase tracking-wider text-[10px] mb-1">
              ENGINE MASS SPEC
            </p>
            <p>DRY WEIGHT: <span className="text-emerald-300 font-bold">{currentCar.stats.weightLbs !== null ? `${currentCar.stats.weightLbs} lbs` : "Unknown"}</span></p>
            <p>ENGINE: <span className="text-emerald-300 truncate block font-bold" title={currentCar.stats.engineType || "Unknown"}>{currentCar.stats.engineType || "Unknown"}</span></p>
            <p>CLASS CATEGORY: <span className="text-emerald-300 font-bold font-retro text-[8px] uppercase">{currentCar.category}</span></p>
          </div>

          {/* Top Right box: Restoration difficulty index */}
          <div className="border border-emerald-500/30 rounded p-2 bg-black/40 flex flex-col justify-between">
            <div>
              <p className="text-emerald-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                RESTORE MATRIX
              </p>
              <div className="flex justify-between text-[10px] items-center mb-0.5">
                <span>COMPS LEVEL:</span>
                <span className="font-bold text-red-400 font-retro text-[8px]">{restoreDifficultyPercent}%</span>
              </div>
            </div>
            {/* Visual health bar */}
            <div className="w-full h-2 bg-neutral-900 rounded-full border border-emerald-500/20 overflow-hidden mt-1">
              <div 
                className="h-full bg-emerald-400 transition-all duration-500" 
                style={{ width: `${restoreDifficultyPercent}%` }}
              />
            </div>
            <p className="text-[9px] text-emerald-500 truncate mt-1">
              PARTS: {currentCar.restoration.partsAvailability}
            </p>
          </div>
        </div>
      </div>

      {/* --- INTERACTIVE STATS BUTTON DIRECTORY ROW --- */}
      <div className="mb-4">
        <p className="text-[10px] font-retro text-red-900 uppercase mb-1.5 px-1">
          DEX INDEX QUICKSELECT KEYPAD
        </p>
        <div className="grid grid-cols-6 gap-2">
          {presets.slice(0, 12).map((car, idx) => {
            const isAc = car.name === currentCar.name;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  sfx.playSuccess();
                  onSelectCar(car);
                }}
                className={`cursor-pointer h-10 border-2 rounded-lg flex flex-col items-center justify-center font-retro text-[9px] font-bold shadow-md transition-all active:scale-95 ${
                  isAc 
                    ? "bg-slate-100 text-red-600 border-white led-glow-blue" 
                    : "bg-sky-700 hover:bg-sky-600 text-sky-100 border-sky-900"
                }`}
                title={`Quick load ${car.brand} ${car.name}`}
              >
                <span>#{car.dexId}</span>
                <span className="text-[7px] truncate max-w-full font-sans uppercase font-medium">{car.brand}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- CONSOLE SCREEN AND TAB SELECTIONS --- */}
      <div className="flex-1 bg-zinc-950 border-4 border-red-800 rounded-2xl flex flex-col p-4">
        {/* Navigation Tabs Bar */}
        <div className="flex gap-1.5 border-b-2 border-zinc-800 pb-3 mb-3 shrink-0">
          <button
            onClick={() => handleTabChange("specs")}
            className={`cursor-pointer px-3 py-1.5 flex items-center gap-1 text-[10px] font-retro tracking-wider rounded border transition-colors ${
              activeTab === "specs"
                ? "bg-amber-600 text-white border-amber-500"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Gauge className="w-3 h-3" />
            STATS
          </button>
          
          <button
            onClick={() => handleTabChange("restoration")}
            className={`cursor-pointer px-3 py-1.5 flex items-center gap-1 text-[10px] font-retro tracking-wider rounded border transition-colors ${
              activeTab === "restoration"
                ? "bg-amber-600 text-white border-amber-500"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Wrench className="w-3 h-3" />
            RESIZE
          </button>

          <button
            onClick={() => handleTabChange("history")}
            className={`cursor-pointer px-3 py-1.5 flex items-center gap-1 text-[10px] font-retro tracking-wider rounded border transition-colors ${
              activeTab === "history"
                ? "bg-amber-600 text-white border-amber-500"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Trophy className="w-3 h-3" />
            HISTORY
          </button>
        </div>

        {/* --- DYNAMIC TAB CONTENT LEDGER --- */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* TAB 1: SPECIFICATION TELEMETRY & GRAPH */}
          {activeTab === "specs" && (
            <div className="space-y-4">
              <div className="border border-zinc-800 rounded bg-zinc-900/60 p-3 leading-relaxed">
                <p className="text-[10px] font-retro text-red-500 uppercase mb-2">
                  PERFORMANCE RATINGS
                </p>
                
                <div className="grid grid-cols-2 gap-3 text-xs font-mono font-medium">
                  <div className="space-y-1.5">
                    <p className="text-zinc-500">MAX BOOST VELOCITY:</p>
                    <p className="text-zinc-200 text-[14px] font-bold text-red-400">
                      {currentCar.stats.topSpeedMph !== null ? `${currentCar.stats.topSpeedMph} MPH` : "N/A"}
                    </p>
                    <p className="text-zinc-500">ACCEL RATE (0-60):</p>
                    <p className="text-zinc-200 text-[14px] font-bold text-amber-400">
                      {currentCar.stats.zeroToSixtyS !== null ? `${currentCar.stats.zeroToSixtyS} Secs` : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-zinc-500">HORSEPOWER (CRANK):</p>
                    <p className="text-zinc-200 text-[14px] font-bold text-emerald-400">
                      {currentCar.stats.horsepower !== null ? `${currentCar.stats.horsepower} HP` : "N/A"}
                    </p>
                    <p className="text-zinc-500">MAX ROTARY TORQUE:</p>
                    <p className="text-zinc-200 text-[14px] font-bold text-sky-400">
                      {currentCar.stats.torqueLbFt !== null ? `${currentCar.stats.torqueLbFt} LB-FT` : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-zinc-800 mt-3 pt-3">
                  <div className="flex justify-between items-center text-[10px] text-zinc-400">
                    <span className="font-retro text-[8px]">POWER WEIGHT INDEX RATIO:</span>
                    <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                      {hpToWeightRatio} HP/Ton
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-sans italic leading-tight mt-1.5">
                    Power to overall body weight metric is high, establishing raw handling dynamics.
                  </p>
                </div>
              </div>

              {/* Dynamic Comparison Geometric Blueprint Grid */}
              <div className="border-4 border-zinc-800 bg-neutral-950 p-4 rounded-xl relative overflow-hidden select-none">
                <div className="absolute top-1 right-2 inline-flex items-center gap-1.5 text-red-500 opacity-60">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span className="text-[8px] font-retro">TELEMETRY GRID</span>
                </div>
                
                <h4 className="text-[10px] font-retro text-zinc-300 uppercase mb-3">
                  COMPARE ERAS LIMIT MAPS
                </h4>

                <div className="space-y-3.5 font-mono text-zinc-400">
                  {/* BAR 1: Top Speed */}
                  <div>
                    <div className="flex justify-between text-[11px] items-center mb-1">
                      <span>Max Speed Peak</span>
                      <span className="text-red-400 font-bold">{currentCar.stats.topSpeedMph} MPH</span>
                    </div>
                    <div className="w-full h-3 bg-zinc-900 border border-zinc-800 rounded p-[1px]">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300"
                        style={{ width: `${speedWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* BAR 2: Acceleration */}
                  <div>
                    <div className="flex justify-between text-[11px] items-center mb-1">
                      <span>Accel Velocity Rate</span>
                      <span className="text-amber-400 font-bold">{currentCar.stats.zeroToSixtyS}s</span>
                    </div>
                    <div className="w-full h-3 bg-zinc-900 border border-zinc-800 rounded p-[1px]">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-300"
                        style={{ width: `${accelWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* BAR 3: Horsepower */}
                  <div>
                    <div className="flex justify-between text-[11px] items-center mb-1">
                      <span>Raw Horsepower Output</span>
                      <span className="text-emerald-400 font-bold">{currentCar.stats.horsepower} HP</span>
                    </div>
                    <div className="w-full h-3 bg-zinc-900 border border-zinc-800 rounded p-[1px]">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-600 to-green-400 transition-all duration-300"
                        style={{ width: `${hpWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* BAR 4: Torque */}
                  <div>
                    <div className="flex justify-between text-[11px] items-center mb-1">
                      <span>Crank Engine Torque</span>
                      <span className="text-sky-400 font-bold">{currentCar.stats.torqueLbFt} lb-ft</span>
                    </div>
                    <div className="w-full h-3 bg-zinc-900 border border-zinc-800 rounded p-[1px]">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-300"
                        style={{ width: `${torqueWidth}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 border-t border-zinc-800 pt-2 text-[10px] text-zinc-500 text-center font-sans tracking-wide">
                  Comparing current vehicle telemetry outputs safely against classic era baselines.
                </div>
              </div>

              {/* AI Vision Analysis block */}
              {(currentCar.confidence !== undefined || currentCar.features) && (
                <div className="border border-zinc-850 bg-zinc-900/40 p-4 rounded-xl relative select-none">
                  <h4 className="text-[10px] font-retro text-amber-500 uppercase mb-2">
                    AI VISION IDENTIFICATION REPORT
                  </h4>

                  {currentCar.confidence !== undefined && (
                    <div className="flex justify-between items-center text-xs font-mono mb-2 border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500">SCANNER CONFIDENCE:</span>
                      <span className={`font-retro text-[10px] tracking-wide uppercase ${
                        currentCar.confidence >= 0.85 
                          ? "text-emerald-400" 
                          : currentCar.confidence >= 0.60 
                            ? "text-amber-400" 
                            : "text-red-400"
                      }`}>
                        {(currentCar.confidence * 100).toFixed(0)}% Match
                      </span>
                    </div>
                  )}

                  {currentCar.features && currentCar.features.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-retro text-zinc-500 uppercase mb-1">
                        SPOTTED CHASSIS FEATURES:
                      </p>
                      <ul className="grid grid-cols-1 gap-1 text-[11px] font-mono text-zinc-400">
                        {currentCar.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-500 text-[10px] mt-0.5">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RESTORATION MAINTENANCE & INTERACTIVE OVERHAUL */}
          {activeTab === "restoration" && (
            <div className="space-y-4">
              {/* Restoration Summary Block */}
              <div className="border border-zinc-800 rounded bg-zinc-900/60 p-3 flex justify-between items-center relative">
                <div>
                  <h4 className="text-[10px] font-retro text-yellow-500 uppercase mb-1">
                    RESTORATION LABOR SCALE
                  </h4>
                  <p className="text-xs font-mono font-medium text-zinc-400">
                    DIFFICULTY: <span className="text-zinc-200 mt-0.5 font-bold uppercase">{restoreDifficultyPercent}/100</span>
                  </p>
                  <p className="text-zinc-500 text-[11px] font-mono capitalize tracking-tight mt-1.5">
                    PARTS: {currentCar.restoration.partsAvailability}
                  </p>
                </div>

                {/* Simulated hazard status lamp bulb indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border-4 border-zinc-800 flex items-center justify-center ${
                    restoreDifficultyPercent > 85 
                      ? "bg-red-500 led-glow-red animate-pulse" 
                      : restoreDifficultyPercent > 65 
                        ? "bg-yellow-500 led-glow-yellow" 
                        : "bg-green-500 led-glow-green"
                  }`}>
                    <Wrench className="w-3.5 h-3.5 text-zinc-900" />
                  </div>
                  <span className="text-[8px] font-retro font-bold text-zinc-400 mt-1 uppercase text-center">
                    {restoreDifficultyPercent > 80 ? "EXPERT" : restoreDifficultyPercent > 60 ? "HARD" : "EASY"}
                  </span>
                </div>
              </div>

              {/* USER-INTERACTIVE CHECKLIST OVERHAULS */}
              <div>
                <p className="text-[10px] font-retro text-zinc-400 uppercase mb-2">
                  AUTOMOTIVE SYSTEM BUG CHECKLIST
                </p>
                
                <div className="space-y-2">
                  {currentCar.restoration.commonIssues.map((issue) => (
                    <div 
                      key={issue.id}
                      onClick={() => onToggleIssue(issue.id)}
                      className={`cursor-pointer p-3 border rounded flex items-start gap-3 transition-colors ${
                        issue.fixed 
                          ? "bg-emerald-950/40 border-emerald-900/50 hover:bg-emerald-900/20" 
                          : "bg-zinc-900 border-zinc-800 hover:bg-zinc-850/80"
                      }`}
                      title="Click component to toggle fixed status!"
                    >
                      <div className="mt-0.5 shrink-0 text-amber-500">
                        {issue.fixed ? (
                          <div className="w-5 h-5 rounded border border-emerald-500 bg-emerald-900 flex items-center justify-center">
                            <span className="text-emerald-300 font-retro text-[8px]">✓</span>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border border-zinc-700 bg-zinc-800" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-mono font-bold uppercase tracking-wide leading-tight ${issue.fixed ? 'text-emerald-400 line-through' : 'text-zinc-200'}`}>
                            {issue.component}
                          </span>
                          <span className={`text-[9px] font-retro px-1.5 py-0.2 rounded ${
                            issue.difficulty === "Expert" 
                              ? "bg-red-950 text-red-500" 
                              : issue.difficulty === "Hard" 
                                ? "bg-orange-950 text-orange-500" 
                                : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {issue.difficulty}
                          </span>
                        </div>
                        <p className={`text-[11px] font-sans mt-1 leading-snug ${issue.fixed ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {issue.description}
                        </p>
                        
                        <div className="flex gap-2.5 items-center mt-2 text-[10px] font-mono text-zinc-500">
                          <span>PARTS RATINGS:</span>
                          <span className="text-zinc-400 font-bold">{issue.rarityOfParts}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro restoration garage tip */}
              <div className="bg-amber-950/40 border border-amber-500/20 rounded p-3 relative">
                <p className="text-[9px] font-retro text-amber-500 uppercase mb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  GARAGE MECHANIC LOG TIP
                </p>
                <p className="text-[12px] text-zinc-300 font-mono italic leading-snug">
                  "{currentCar.restoration.proRestorationTip}"
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: LEGENDARY MOTORING HISTORY & FACT */}
          {activeTab === "history" && (
            <div className="space-y-4">
              {/* Origin Geo block */}
              <div className="border border-zinc-800 rounded bg-zinc-900/60 p-3 leading-relaxed">
                <p className="text-[10px] font-retro text-rose-500 uppercase mb-2">
                  HISTORICAL REGISTRATION
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-xs font-mono font-bold">
                  <div>
                    <p className="text-zinc-500">GEOPOLITICAL ORIGIN:</p>
                    <p className="text-zinc-200 mt-1 capitalize text-[13px] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {currentCar.history.originCountry}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">MOTORING RARITY SCALE:</p>
                    <p className="text-zinc-200 mt-1 text-[13px] text-red-400 font-retro text-[9px] tracking-wide uppercase">
                      {currentCar.rarity}
                    </p>
                  </div>
                </div>
              </div>

              {/* Era Context */}
              <div className="border border-zinc-800 rounded bg-zinc-900/60 p-3">
                <p className="text-[9px] font-retro text-zinc-400 uppercase mb-1">
                  ERA CULTURE & SCENE
                </p>
                <p className="text-zinc-300 text-xs font-mono leading-relaxed">
                  {currentCar.history.eraCulture}
                </p>
              </div>

              {/* Famous Races / Drivers */}
              <div className="border border-zinc-800 bg-zinc-900/60 rounded p-3">
                <p className="text-[9px] font-retro text-emerald-500 uppercase mb-1 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  RACING LEGEND CHRONICLES
                </p>
                <p className="text-zinc-200 text-xs font-mono leading-relaxed">
                  {currentCar.history.notableDriverOrRace}
                </p>
              </div>

              {/* The legendary trivia card */}
              <div className="border-4 border-slate-800 bg-neutral-900 rounded-xl p-4 shadow-md relative">
                <p className="text-[10px] font-retro text-zinc-400 uppercase mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-sky-400" />
                  LEGENDARY TRIVIA FACT
                </p>
                <p className="text-zinc-300 text-xs font-mono italic leading-relaxed">
                  {currentCar.history.legendaryFact}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* --- PANEL FOOTER (ACTION METRIC SIMULATION) --- */}
        <div className="mt-3.5 border-t-2 border-zinc-800 pt-3 flex justify-between items-center text-[10px] font-mono leading-none select-none shrink-0">
          <div className="flex gap-2">
            <div className="h-2 w-12 bg-rose-500 rounded-full animate-pulse" />
            <div className="h-2 w-8 bg-zinc-800 rounded-full" />
          </div>
          <span className="text-zinc-500 font-retro text-[8px]">
            CARDEX FIRMWARE V1.15
          </span>
        </div>
      </div>
    </div>
  );
};
