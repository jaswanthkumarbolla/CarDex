import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, Home, Scan, Grid, Gamepad2, X, Info } from "lucide-react";
import { sfx } from "./ClassicAudio";

type TabType = "home" | "detector" | "catalog" | "guessingGame";

interface HeaderNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  apiKeyStatus?: "checking" | "active" | "missing";
}

interface MenuOption {
  id: TabType;
  label: string;
  subLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  angle: number;
}

const MENU_OPTIONS: MenuOption[] = [
  {
    id: "home",
    label: "HOME",
    subLabel: "3D Showroom & Interactive Showcase",
    icon: Home,
    angle: 0,
  },
  {
    id: "detector",
    label: "DETECTOR",
    subLabel: "AI Vehicle Identification & Spec Scanner",
    icon: Scan,
    angle: 70,
  },
  {
    id: "catalog",
    label: "CATALOG",
    subLabel: "Saved Garage & Vehicle Specifications",
    icon: Grid,
    angle: 140,
  },
  {
    id: "guessingGame",
    label: "GUESS GAME",
    subLabel: "Automotive Trivia & Silhouette Challenge",
    icon: Gamepad2,
    angle: 210,
  },
];

export const HeaderNav: React.FC<HeaderNavProps> = ({ activeTab, onTabChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<TabType | null>(null);
  const [imgError, setImgError] = useState(false);

  // Lock body scroll when full-screen menu or about modal is open
  useEffect(() => {
    if (isMenuOpen || isAboutOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen, isAboutOpen]);

  // Determine current active or hovered option for steering wheel angle
  const currentOptionId = hoveredTab || activeTab;
  const currentOption = MENU_OPTIONS.find((opt) => opt.id === currentOptionId) || MENU_OPTIONS[0];
  const targetAngle = currentOption.angle;

  const handleOptionHover = (option: MenuOption) => {
    if (hoveredTab !== option.id) {
      setHoveredTab(option.id);
    }
  };

  const handleOptionClick = (tabId: TabType) => {
    sfx.playClick();
    onTabChange(tabId);
    setIsMenuOpen(false);
  };

  return (
    <header className="max-w-6xl mx-auto w-full mb-8 z-30 relative font-sans px-2">
      {/* Top Header Bar - Clean, Minimal, Unboxed Header */}
      <div className="w-full py-4 flex justify-between items-center gap-6">
        
        {/* Left Side: CARDEX Wordmark Only */}
        <button
          onClick={() => {
            sfx.playClick();
            onTabChange("home");
          }}
          className="cursor-pointer focus:outline-none text-left group"
        >
          <span className="font-retro text-xl sm:text-2xl tracking-widest text-white uppercase block leading-none group-hover:opacity-90 transition-opacity">
            CAR<span className="text-red-500">DEX</span>
          </span>
        </button>

        {/* Right Side: Hamburger Menu & About Text Button */}
        <div className="flex items-center gap-4 sm:gap-6">
          
          {/* HAMBURGER MENU BUTTON */}
          <button
            onClick={() => {
              sfx.playClick();
              setIsMenuOpen(true);
            }}
            aria-label="Open Navigation Menu"
            className="cursor-pointer p-1.5 text-zinc-300 hover:text-white transition-colors focus:outline-none flex items-center gap-2 rounded hover:bg-zinc-900/50 group"
          >
            <Menu className="w-6 h-6 text-white" />
            <span className="text-xs font-mono tracking-wider text-zinc-300 group-hover:text-white uppercase transition-colors">
              MENU
            </span>
          </button>

          {/* ABOUT BUTTON */}
          <button
            onClick={() => {
              sfx.playClick();
              setIsAboutOpen(true);
            }}
            className="cursor-pointer text-xs font-mono tracking-wider text-zinc-400 hover:text-white uppercase transition-colors flex items-center gap-1.5 group p-1.5 rounded hover:bg-zinc-900/50"
          >
            <Info className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
            <span>ABOUT</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: "-100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "-100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 left-0 right-0 h-[75vh] min-h-[480px] max-h-[720px] bg-black text-slate-100 z-50 flex flex-col justify-between p-6 md:p-10 border-b border-zinc-800 shadow-[0_30px_80px_rgba(0,0,0,0.98)] font-sans overflow-hidden"
            >
              {/* --- TOP BAR --- */}
              <div className="w-full border-b border-zinc-800 pb-4 flex items-center justify-between relative z-10 gap-4">
                
                {/* Left Logo - WORDMARK ONLY */}
                <span className="font-retro text-lg sm:text-xl tracking-widest text-white uppercase block leading-none">
                  CAR<span className="text-red-500">DEX</span>
                </span>

                {/* Center CLOSE Button */}
                <button
                  onClick={() => {
                    sfx.playClick();
                    setIsMenuOpen(false);
                  }}
                  className="cursor-pointer font-retro text-xs tracking-widest text-zinc-300 hover:text-white flex items-center gap-2 px-3 py-1 rounded border border-zinc-800 hover:border-red-600 bg-zinc-950 hover:bg-red-950/60 transition-all uppercase group"
                >
                  <span>CLOSE</span>
                  <X className="w-3.5 h-3.5 text-red-500 ml-1" />
                </button>
              </div>

              {/* --- MAIN CONTENT (2 COLUMNS: STEERING WHEEL + NAVIGATION ITEMS) --- */}
              <div className="w-full my-auto py-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                
                {/* COLUMN 1: ROTATING STEERING WHEEL IMAGE ONLY */}
                <div className="lg:col-span-5 flex items-center justify-center relative">
                  
                  {/* DYNAMIC ROTATING STEERING WHEEL (STANDALONE) */}
                  <motion.div
                    className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 relative flex items-center justify-center transform-gpu"
                    animate={{ rotate: targetAngle }}
                    transition={{ type: "spring", stiffness: 200, damping: 22 }}
                  >
                    {!imgError ? (
                      <img
                        src="/bmwwheel.png"
                        alt="BMW Steering Wheel"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)]"
                      />
                    ) : (
                      /* High-fidelity Vector BMW M Steering Wheel Fallback */
                      <div className="w-full h-full relative flex items-center justify-center">
                        <svg
                          viewBox="0 0 200 200"
                          className="w-full h-full filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)]"
                        >
                          <circle cx="100" cy="100" r="88" fill="none" stroke="#18181b" strokeWidth="18" />
                          <circle cx="100" cy="100" r="88" fill="none" stroke="#27272a" strokeWidth="12" />
                          <path
                            d="M 94 12 A 88 88 0 0 1 106 12"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="14"
                            strokeLinecap="round"
                          />
                          <circle cx="100" cy="100" r="78" fill="none" stroke="#09090b" strokeWidth="2" />
                          <path d="M 22 100 L 70 100 L 72 112 L 24 116 Z" fill="#27272a" stroke="#18181b" />
                          <path d="M 178 100 L 130 100 L 128 112 L 176 116 Z" fill="#27272a" stroke="#18181b" />
                          <path d="M 94 130 L 106 130 L 104 176 L 96 176 Z" fill="#27272a" stroke="#18181b" />
                          <circle cx="100" cy="100" r="32" fill="#18181b" stroke="#3f3f46" strokeWidth="3" />
                          <circle cx="100" cy="100" r="28" fill="#000000" stroke="#27272a" strokeWidth="1" />
                          <circle cx="100" cy="100" r="16" fill="#18181b" stroke="#ffffff" strokeWidth="1.5" />
                          <path d="M 100 84 A 16 16 0 0 1 116 100 L 100 100 Z" fill="#0066b1" />
                          <path d="M 84 100 A 16 16 0 0 1 100 84 L 100 100 Z" fill="#ffffff" />
                          <path d="M 100 116 A 16 16 0 0 1 84 100 L 100 100 Z" fill="#0066b1" />
                          <path d="M 116 100 A 16 16 0 0 1 100 116 L 100 100 Z" fill="#ffffff" />
                          <rect x="91" y="142" width="6" height="12" fill="#0066b1" />
                          <rect x="97" y="142" width="6" height="12" fill="#27255d" />
                          <rect x="103" y="142" width="6" height="12" fill="#e2231a" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* COLUMN 2: NAVIGATION OPTIONS */}
                <div
                  className="lg:col-span-7 flex flex-col justify-center gap-3 sm:gap-4 pl-0 lg:pl-8"
                  onMouseLeave={() => setHoveredTab(null)}
                >
                  {MENU_OPTIONS.map((option, idx) => {
                    const isHovered = currentOptionId === option.id;
                    const isActive = activeTab === option.id;

                    return (
                      <button
                        key={option.id}
                        onMouseEnter={() => handleOptionHover(option)}
                        onClick={() => handleOptionClick(option.id)}
                        className="cursor-pointer text-left group focus:outline-none relative py-1 transition-transform duration-200"
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* Number Prefix */}
                          <span
                            className={`font-mono text-xs transition-colors duration-200 ${
                              isHovered ? "text-red-500 font-bold" : "text-zinc-600"
                            }`}
                          >
                            0{idx + 1}.
                          </span>

                          {/* Navigation Item Label */}
                          <span
                            className={`font-retro text-lg sm:text-2xl uppercase tracking-wider transition-all duration-200 ${
                              isHovered
                                ? "text-red-500 font-bold drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] translate-x-2"
                                : "text-zinc-200 hover:text-white"
                            }`}
                          >
                            {option.label}
                          </span>

                          {/* Active Badge */}
                          {isActive && (
                            <span className="text-[9px] font-mono font-bold bg-red-950/80 border border-red-700/80 text-red-400 px-2 py-0.5 rounded uppercase ml-auto">
                              ACTIVE
                            </span>
                          )}
                        </div>

                        {/* Sub-label description */}
                        <p
                          className={`text-xs font-mono mt-0.5 pl-7 sm:pl-8 transition-colors duration-200 ${
                            isHovered ? "text-zinc-300" : "text-zinc-500"
                          }`}
                        >
                          {option.subLabel}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* --- BOTTOM FOOTER STRIP --- */}
              <div className="w-full border-t border-zinc-900 pt-3 flex items-center justify-between text-[10px] font-mono text-zinc-600 relative z-10">
                <span>CARDEX</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* ABOUT MODAL SECTION OVERLAY                               */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isAboutOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setIsAboutOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative text-slate-100 overflow-hidden font-sans"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  sfx.playClick();
                  setIsAboutOpen(false);
                }}
                className="cursor-pointer absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <h2 className="font-retro text-xl sm:text-2xl tracking-wide text-white uppercase">
                  CAR<span className="text-red-500">DEX</span>
                </h2>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  Automotive Catalog & Recognition Platform
                </p>
              </div>

              {/* Description Body */}
              <div className="space-y-4 text-xs font-mono leading-relaxed text-zinc-300">
                <p className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl text-zinc-200">
                  <strong className="text-red-400 font-bold">CarDex</strong> is an interactive automotive platform designed to identify cars from photos, explore technical specifications, store your personal vehicle catalog, and test your car trivia knowledge.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl">
                    <span className="font-retro text-[9px] text-red-400 uppercase block mb-1">
                      01. AI DETECTOR
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Upload photos to identify car make, model, year, trim, and performance specs instantly.
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl">
                    <span className="font-retro text-[9px] text-red-400 uppercase block mb-1">
                      02. SPECIFICATION ENGINE
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      View horsepower, 0-60 mph times, top speeds, engine layouts, and transmission options.
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl">
                    <span className="font-retro text-[9px] text-red-400 uppercase block mb-1">
                      03. GARAGE CATALOG
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Save, organize, and inspect your favorite cars and technical spec cards.
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl">
                    <span className="font-retro text-[9px] text-red-400 uppercase block mb-1">
                      04. TRIVIA GAME
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Challenge your car knowledge with silhouetted outlines and spec sheet trivia.
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Action */}
              <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => {
                    sfx.playClick();
                    setIsAboutOpen(false);
                  }}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-retro text-xs uppercase tracking-wider transition-all"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

