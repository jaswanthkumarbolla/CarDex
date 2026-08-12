import React, { useState } from "react";
import { CarDexEntry } from "../types";
import { Search, Grid, List, Activity, Sparkles, Trophy, Wrench } from "lucide-react";
import { sfx } from "./ClassicAudio";

interface CatalogProps {
  presets: CarDexEntry[];
  currentCar: CarDexEntry | null;
  onSelectCar: (car: CarDexEntry) => void;
  onNavigateToScanner: () => void;
}

export const CarCatalog: React.FC<CatalogProps> = ({
  presets,
  currentCar,
  onSelectCar,
  onNavigateToScanner,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "JDM", "Muscle", "Exotic", "Classic Vintage", "Tuned Cult"];

  const filteredCars = presets.filter((car) => {
    const matchesSearch = 
      car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.year.toString().includes(searchTerm);
    
    const matchesCategory = activeCategory === "All" || car.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectCar = (car: CarDexEntry) => {
    sfx.playSuccess();
    onSelectCar(car);
    onNavigateToScanner(); // takes them back to inspect detailed metrics
  };

  const completedIssuesCount = (car: CarDexEntry) => {
    return car.restoration.commonIssues.filter(i => i.fixed).length;
  };

  const totalIssuesCount = (car: CarDexEntry) => {
    return car.restoration.commonIssues.length;
  };

  return (
    <div id="catalog-container" className="w-full bg-zinc-950/80 border-4 border-zinc-900 rounded-3xl p-6 shadow-2xl z-10 backdrop-blur-md">
      
      {/* Search & Category Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b-2 border-zinc-900 pb-5 mb-6">
        <div className="w-full md:w-80 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <Search className="h-4 w-4 text-zinc-500" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="FILTER CATALOG BY NAME/YEAR..."
            className="w-full text-zinc-200 bg-zinc-900 border-2 border-zinc-800 rounded-xl px-3 py-2 pl-10 text-xs font-mono focus:outline-none focus:border-red-500 uppercase placeholder-zinc-600"
          />
        </div>

        {/* Categorization filter tags */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sfx.playClick();
                setActiveCategory(cat);
              }}
              className={`cursor-pointer px-3.5 py-1.5 text-[9px] font-retro rounded-lg border transition-all uppercase ${
                activeCategory === cat
                  ? "bg-red-600 font-bold border-red-500 text-white led-glow-red"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {filteredCars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => {
            const isCurrent = currentCar?.name === car.name;
            const completionPercent = totalIssuesCount(car) > 0 
              ? Math.round((completedIssuesCount(car) / totalIssuesCount(car)) * 100) 
              : 100;

            return (
              <div
                key={car.name}
                onClick={() => handleSelectCar(car)}
                className={`cursor-pointer group relative bg-neutral-900 rounded-2xl border-4 overflow-hidden transition-all duration-300 hover:translate-y-[-4px] ${
                  isCurrent 
                    ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
                    : "border-zinc-800 hover:border-zinc-700 hover:shadow-xl"
                }`}
              >
                {/* Visual Accent Corner Ribbon based on Category */}
                <div className="absolute top-2 right-2 z-10">
                  <span className={`text-[8px] font-retro px-2 py-0.5 rounded shadow border uppercase ${
                    car.rarity === "Mythical" 
                      ? "bg-purple-950 text-purple-400 border-purple-800" 
                      : car.rarity === "Legendary" 
                        ? "bg-rose-950 text-rose-400 border-rose-800 animate-pulse" 
                        : car.rarity === "Rare" 
                          ? "bg-blue-950 text-blue-400 border-blue-800" 
                          : "bg-zinc-800 text-zinc-300 border-zinc-700"
                  }`}>
                    {car.rarity}
                  </span>
                </div>

                {/* Car Portrait */}
                <div className="h-44 relative bg-zinc-950 overflow-hidden">
                  <img
                    src={car.imageUrl}
                    alt={car.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 brightness-90 saturate-110"
                  />
                  {/* Subtle Scan lines Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%)] pointer-events-none bg-[length:100%_4px]" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neutral-900 to-transparent" />
                  
                  {/* Floating Class Tag */}
                  <span className="absolute bottom-2 left-3 text-[8px] font-retro bg-black/80 px-2 py-0.5 rounded text-red-500 uppercase">
                    #{car.dexId} • {car.category}
                  </span>
                </div>

                {/* Typography metadata */}
                <div className="p-4 space-y-3.5">
                  <div>
                    <span className="text-[10px] font-retro text-zinc-500 uppercase tracking-widest">{car.brand}</span>
                    <h3 className="text-lg font-bold text-zinc-200 mt-0.5 leading-tight truncate group-hover:text-white transition-colors uppercase">
                      {car.name}
                    </h3>
                    <p className="text-zinc-400 text-xs font-mono tracking-wide mt-1">
                      Release Year: <span className="text-zinc-200 font-bold">{car.year}</span> • Origin: <span className="text-zinc-200 font-bold capitalize">{car.history.originCountry}</span>
                    </p>
                  </div>

                  {/* Mechanical stats strip */}
                  <div className="grid grid-cols-3 gap-2 bg-black/40 p-2 rounded-xl border border-zinc-800/40 text-center font-mono">
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase leading-none">POWER</p>
                      <p className="text-xs text-emerald-400 font-bold mt-1 uppercase">{car.stats.horsepower} HP</p>
                    </div>
                    <div className="border-x border-zinc-800/60">
                      <p className="text-[9px] text-zinc-500 uppercase leading-none">SPEED</p>
                      <p className="text-xs text-red-400 font-bold mt-1 uppercase">{car.stats.topSpeedMph} MPH</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase leading-none">RESTORE</p>
                      <p className="text-xs text-amber-500 font-bold mt-1 uppercase">{car.restoration.difficultyRating}/100</p>
                    </div>
                  </div>

                  {/* Overhaul progress indicator */}
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-zinc-400" />
                      OVERHAULS FIXED:
                    </span>
                    <span className="font-mono text-zinc-300 font-bold">
                      {completedIssuesCount(car)}/{totalIssuesCount(car)} ({completionPercent}%)
                    </span>
                  </div>
                </div>

                {/* Glowing action line on hover */}
                <div className="absolute bottom-0 inset-x-0 h-1 bg-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border-4 border-dashed border-zinc-850 p-6">
          <Sparkles className="w-12 h-12 text-zinc-600 mx-auto animate-pulse mb-3" />
          <h3 className="text-md font-retro text-zinc-400 uppercase">NO VEHICLES REGISTERED</h3>
          <p className="text-zinc-500 font-mono text-xs mt-2 uppercase">
            TRY SEARCHING ANOTHER CAR NAME IN THE CONTROLLER CONSOLE WINDOW.
          </p>
        </div>
      )}
    </div>
  );
};
