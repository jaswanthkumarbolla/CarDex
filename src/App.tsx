import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CarDexEntry } from "./types";
import { saveCarToFirestore, subscribeToFirestoreCars } from "./firebase";
import { PokedexLeftPanel } from "./components/PokedexLeftPanel";
import { PokedexRightPanel } from "./components/PokedexRightPanel";
import { CarCatalog } from "./components/CarCatalog";
import { CarGuessingGame } from "./components/CarGuessingGame";
import { PixelSupercarsBackground } from "./components/PixelSupercarsBackground";
import { ScrollDrum } from "./components/ScrollDrum";
import { HeaderNav } from "./components/HeaderNav";
import { sfx } from "./components/ClassicAudio";
import { ShieldAlert, Cpu, Heart, Database, Scan, Grid, Gamepad2 } from "lucide-react";

export default function App() {
  const [presets, setPresets] = useState<CarDexEntry[]>([]);
  const [currentCar, setCurrentCar] = useState<CarDexEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<"checking" | "active" | "missing">("checking");

  // Section view state: home, detector, catalog, or guessingGame
  const [activeTab, setActiveTab] = useState<"home" | "detector" | "catalog" | "guessingGame">("home");

  const [scrollY, setScrollY] = useState(0);

  // High-fidelity tab change transition interceptor
  const handleTabChange = (nextTab: "home" | "detector" | "catalog" | "guessingGame") => {
    if (nextTab === activeTab) return;
    sfx.playClick();
    setActiveTab(nextTab);
  };

  useEffect(() => {
    if (activeTab !== "home") {
      setScrollY(0);
      return;
    }
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  const scrollProgress = Math.min(1, Math.max(0, scrollY / 240));
  const heroScale = 1 - (scrollProgress * 0.58);
  const heroY = scrollProgress * -160;
  const heroOpacity = 1 - (scrollProgress * 0.15);

  // Load Presets on Init and Subscribe to Firestore Scanned Cars
  useEffect(() => {
    let defaultPresets: CarDexEntry[] = [];

    async function loadPresets() {
      try {
        setLoading(true);
        const res = await fetch("/api/cardex/presets");
        const data = await res.json();
        
        // Check actual API key status
        const statusRes = await fetch("/api/cardex/status").catch(() => null);
        const statusData = statusRes ? await statusRes.json().catch(() => null) : null;
        if (statusData && statusData.success && statusData.hasApiKey) {
          setApiKeyStatus("active");
        } else {
          setApiKeyStatus("missing");
        }

        if (data.success && data.list) {
          defaultPresets = data.list;
          setPresets((prev) => {
            const combined = [...prev];
            defaultPresets.forEach((dp) => {
              if (!combined.some((c) => c.name.toLowerCase() === dp.name.toLowerCase())) {
                combined.push(dp);
              }
            });
            return combined;
          });
          setCurrentCar((prev) => prev || (defaultPresets.length > 0 ? defaultPresets[0] : null));
        }
      } catch (err) {
        console.warn("Express server preset load failed or key missing.", err);
        setApiKeyStatus("missing");
      } finally {
        setLoading(false);
      }
    }

    loadPresets();

    // Subscribe to Firestore for cross-device persistence
    const unsubscribe = subscribeToFirestoreCars((firestoreCars) => {
      if (firestoreCars && firestoreCars.length > 0) {
        setPresets((prev) => {
          const merged = [...firestoreCars];
          prev.forEach((car) => {
            if (!merged.some((m) => m.name.toLowerCase() === car.name.toLowerCase())) {
              merged.push(car);
            }
          });
          return merged;
        });
        setCurrentCar((prev) => prev || firestoreCars[0]);
      }
    });

    return () => unsubscribe();
  }, []);

  // API Call: Search or Generate any car name via Gemini
  const handleSearch = async (carName: string) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const res = await fetch("/api/cardex/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: carName })
      });

      const data = await res.json();
      if (data.success && data.entry) {
        sfx.playSuccess();
        const entry: CarDexEntry = data.entry;
        
        // Save to Firestore for cross-device sharing
        saveCarToFirestore(entry);

        // Append to current presets list if it is completely new!
        setPresets((prev) => {
          if (prev.some((c) => c.name.toLowerCase() === entry.name.toLowerCase())) {
            return prev;
          }
          return [entry, ...prev];
        });
        setCurrentCar(entry);
        handleTabChange("detector"); // switch back to inspect it
      } else {
        throw new Error(data.error || "Uplink returned an unidentified registry.");
      }
    } catch (err: any) {
      console.error(err);
      sfx.playError();
      setErrorMessage(err.message || "Failed to establish satellite connection.");
    } finally {
      setLoading(false);
    }
  };

  // API Call: Process Picture Scan via Gemini Vision
  const handleScanImage = async (base64: string, mimeType: string) => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await fetch("/api/cardex/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType })
      });

      const data = await res.json();
      if (data.success && data.entry) {
        sfx.playSuccess();
        const entry: CarDexEntry = data.entry;
        
        // Save to Firestore for cross-device sharing
        saveCarToFirestore(entry);

        setPresets((prev) => {
          if (prev.some((c) => c.name.toLowerCase() === entry.name.toLowerCase())) {
            return prev;
          }
          return [entry, ...prev];
        });
        setCurrentCar(entry);
        handleTabChange("detector"); // switch back to inspect it
      } else {
        throw new Error(data.error || "Vision processor could not identify vehicle chassis.");
      }
    } catch (err: any) {
      console.error(err);
      sfx.playError();
      setErrorMessage(err.message || "Vision uplink failed. Verify GEMINI_API_KEY in your settings.");
    } finally {
      setLoading(false);
    }
  };

  // Local State modification: checklist boxes Fixed state
  const handleToggleIssue = (issueId: string) => {
    if (!currentCar) return;
    sfx.playClick();
    
    // De-serialize and modify current issues list
    const updatedIssues = currentCar.restoration.commonIssues.map((issue) => {
      if (issue.id === issueId) {
        return { ...issue, fixed: !issue.fixed };
      }
      return issue;
    });

    const refreshedCar: CarDexEntry = {
      ...currentCar,
      restoration: {
        ...currentCar.restoration,
        commonIssues: updatedIssues
      }
    };

    saveCarToFirestore(refreshedCar);

    // Reflect inside presets index list as well to maintain correct index mapping
    setPresets((prev) =>
      prev.map((c) => (c.name === currentCar.name ? refreshedCar : c))
    );
    setCurrentCar(refreshedCar);
  };

  // Horizontal Browsing Switchers (Cyclic selection)
  const handleNextCar = () => {
    if (presets.length < 2 || !currentCar) return;
    const currentIndex = presets.findIndex((c) => c.name === currentCar.name);
    const nextIndex = (currentIndex + 1) % presets.length;
    setCurrentCar(presets[nextIndex]);
  };

  const handlePrevCar = () => {
    if (presets.length < 2 || !currentCar) return;
    const currentIndex = presets.findIndex((c) => c.name === currentCar.name);
    const prevIndex = (currentIndex - 1 + presets.length) % presets.length;
    setCurrentCar(presets[prevIndex]);
  };



  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      id="app-root-container"
      className="min-h-screen bg-black text-slate-100 font-sans p-4 sm:p-6 lg:p-8 flex flex-col justify-between selection:bg-rose-500 selection:text-white relative"
    >
      
      <PixelSupercarsBackground />

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-96 h-96 rounded-full bg-gradient-to-tr from-rose-600/10 to-red-600/10 blur-[120px]"
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -30, 50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 blur-[130px]"
          animate={{
            x: [0, -60, 40, 0],
            y: [0, 50, -30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <HeaderNav activeTab={activeTab} onTabChange={handleTabChange} apiKeyStatus={apiKeyStatus} />

      {apiKeyStatus === "missing" && (
        <div id="api-key-status-banner" className="max-w-6xl mx-auto w-full mb-6 z-10 bg-amber-950/40 border border-amber-900/60 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3.5 text-xs font-mono leading-relaxed transition-all">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/35 shrink-0">
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <span className="font-bold text-amber-400 uppercase font-retro text-[9px] block mb-0.5">Gemini API Key Required</span>
            <p className="text-zinc-300">
              <strong className="text-amber-300">GEMINI_API_KEY</strong> environment variable was not detected. Please add it in your Settings to enable live photo scanning and AI searches. In the meantime, explore pre-loaded presets and games.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div id="error-hud" className="max-w-6xl mx-auto w-full mb-6 z-10 bg-red-950/50 border border-red-900/60 p-4 rounded-xl flex items-center gap-3.5 text-xs font-mono leading-relaxed transition-all">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold text-red-400 uppercase font-retro text-[9px] block mb-0.5">SEARCH / SCAN ERROR</span>
            <p className="text-zinc-300">{errorMessage}</p>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="cursor-pointer text-[10px] text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded px-2 py-0.5 focus:outline-none uppercase"
          >
            DISMISS
          </button>
        </div>
      )}

      <main id="main-application-casing" className="max-w-6xl mx-auto w-full flex-1 flex items-center justify-center py-4 z-10 relative">
        <div className="w-full h-full">

          <AnimatePresence mode="wait">
            {activeTab === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex flex-col items-center relative overflow-visible"
              >
                <div
                  className="w-full max-w-7xl min-h-[64vh] flex flex-col items-center justify-center rounded-3xl border-4 border-zinc-900 bg-black py-16 px-8 sm:p-16 overflow-hidden relative mb-16"
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover scale-[0.96] sm:scale-[1.02] opacity-20 pointer-events-none z-0"
                  >
                    <source src="/bg_video.mp4" type="video/mp4" />
                  </video>

                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] opacity-35 pointer-events-none z-10" />

                  <h1 className="font-retro text-4xl sm:text-6xl md:text-7xl lg:text-[6rem] xl:text-[7rem] leading-none tracking-tight select-none uppercase text-center relative z-10 text-white">
                    CAR<span className="text-[#ff0000]">DEX</span>
                  </h1>

                  <div className="w-32 h-1.5 bg-[#ff0000] my-6 relative z-10" />

                  <p className="font-retro text-[9px] sm:text-[11px] text-zinc-400 tracking-[0.25em] relative z-10 text-center uppercase">
                    AUTOMOTIVE CATALOG & RECOGNITION PLATFORM
                  </p>
                </div>

                <ScrollDrum onLaunchTab={handleTabChange} />
              </motion.div>
            )}
            
            {activeTab === "detector" && (
              <motion.div
                key="detector"
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <div className="w-full flex flex-col lg:flex-row gap-6 relative justify-center items-center">
                  <PokedexLeftPanel
                    currentCar={currentCar}
                    historyList={presets}
                    loading={loading}
                    onSearch={handleSearch}
                    onScanImage={handleScanImage}
                    onSelectCar={setCurrentCar}
                    onNextCar={handleNextCar}
                    onPrevCar={handlePrevCar}
                  />

                  <div className="hidden lg:flex flex-col justify-around items-center w-6 shrink-0 relative py-20 bg-neutral-900 rounded-full border-x-4 border-neutral-800 shadow-inner select-none pointer-events-none">
                    <div className="w-4 h-12 bg-neutral-950 rounded border-y border-neutral-700" />
                    <div className="w-4 h-12 bg-neutral-950 rounded border-y border-neutral-700" />
                    <div className="w-4 h-12 bg-neutral-950 rounded border-y border-neutral-700" />
                  </div>

                  <PokedexRightPanel
                    currentCar={currentCar}
                    presets={presets}
                    onSelectCar={(c) => {
                      setCurrentCar(c);
                    }}
                    onToggleIssue={handleToggleIssue}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === "catalog" && (
              <motion.div
                key="catalog"
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <CarCatalog
                  presets={presets}
                  currentCar={currentCar}
                  onSelectCar={setCurrentCar}
                  onNavigateToScanner={() => handleTabChange("detector")}
                />
              </motion.div>
            )}

            {activeTab === "guessingGame" && (
              <motion.div
                key="guessingGame"
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <CarGuessingGame presets={presets} />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* --- FLOATING FOOTER --- */}
      <footer className="max-w-6xl mx-auto w-full mt-6 z-10 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-zinc-500 gap-3 border-t border-zinc-900 pt-4">
        <p className="flex items-center gap-1 leading-none uppercase">
          Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for motor enthusiasts and classic mechanics.
        </p>
        <div className="flex gap-4">
          <span className="uppercase text-zinc-500 font-mono text-[10px]">CARDEX AUTOMOTIVE</span>
        </div>
      </footer>

    </motion.div>
  );
}
