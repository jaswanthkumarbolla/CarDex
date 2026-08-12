import React, { useState, useEffect } from "react";
import { CarDexEntry } from "../types";
import { sfx } from "./ClassicAudio";
import { Trophy, HelpCircle, RefreshCw, ChevronRight, Zap, Target } from "lucide-react";

interface GuessingGameProps {
  presets: CarDexEntry[];
}

export const CarGuessingGame: React.FC<GuessingGameProps> = ({ presets }) => {
  const [currentQuestionCar, setCurrentQuestionCar] = useState<CarDexEntry | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Game metrics
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [totalGuessed, setTotalGuessed] = useState<number>(0);

  // Initialize a new round
  const startNewRound = () => {
    if (presets.length === 0) return;
    
    // Choose a random car
    const randomCarIndex = Math.floor(Math.random() * presets.length);
    const targetCar = presets[randomCarIndex];
    
    // Generate options
    const pool = presets.filter((car) => car.name !== targetCar.name);
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
    const incorrectOptions = shuffledPool.slice(0, 3).map((car) => `${car.brand} ${car.name}`);
    
    const correctOptionName = `${targetCar.brand} ${targetCar.name}`;
    const allOptions = [...incorrectOptions, correctOptionName].sort(() => 0.5 - Math.random());
    
    setCurrentQuestionCar(targetCar);
    setOptions(allOptions);
    setHintLevel(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  useEffect(() => {
    startNewRound();
  }, [presets]);

  const handleAnswerSelection = (answer: string) => {
    if (selectedAnswer !== null || !currentQuestionCar) return;
    
    const correctAnswerName = `${currentQuestionCar.brand} ${currentQuestionCar.name}`;
    const correct = answer === correctAnswerName;
    
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setTotalGuessed((prev) => prev + 1);

    if (correct) {
      sfx.playSuccess();
      setScore((prev) => prev + 10);
      setStreak((prev) => {
        const nextStreak = prev + 1;
        if (nextStreak > highScore) {
          setHighScore(nextStreak);
        }
        return nextStreak;
      });
    } else {
      sfx.playError();
      setStreak(0);
    }
  };

  // Reveal next clue tool
  const triggerNextHint = () => {
    sfx.playClick();
    setHintLevel((prev) => Math.min(3, prev + 1));
  };

  if (!currentQuestionCar) {
    return (
      <div className="text-center py-20 font-retro text-zinc-500 uppercase text-xs">
        No presets registered under the CarDex system.
      </div>
    );
  }

  const accuracy = totalGuessed > 0 ? Math.round((score / (totalGuessed * 10)) * 100) : 0;

  return (
    <div id="guessing-game-container" className="w-full bg-zinc-950/80 border-4 border-zinc-900 rounded-3xl p-6 shadow-2xl relative z-10 backdrop-blur-md">
      
      {/* Top Header Metrics bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center bg-black/60 p-4 rounded-2xl border-2 border-zinc-900 font-mono mb-6">
        <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-zinc-850 pb-2 sm:pb-0">
          <p className="text-[9px] text-zinc-500 uppercase">SCORE OVERALL</p>
          <p className="text-lg text-emerald-400 font-bold tracking-wider mt-0.5">{score} pts</p>
        </div>
        <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-zinc-850 pb-2 sm:pb-0 pl-0 sm:pl-4">
          <p className="text-[9px] text-zinc-500 uppercase flex items-center justify-center sm:justify-start gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            STREAK
          </p>
          <p className="text-lg text-amber-400 font-bold tracking-wider mt-0.5">{streak} / {highScore} max</p>
        </div>
        <div className="text-center sm:text-left border-r border-zinc-850 pl-0 sm:pl-4">
          <p className="text-[9px] text-zinc-500 uppercase flex items-center justify-center sm:justify-start gap-1">
            <Target className="w-3.5 h-3.5 text-rose-500" />
            ACCURACY
          </p>
          <p className="text-lg text-rose-400 font-bold tracking-wider mt-0.5">{accuracy}%</p>
        </div>
        <div className="text-center sm:text-left pl-0 sm:pl-4">
          <p className="text-[9px] text-zinc-500 uppercase">SATELLITE SECTOR</p>
          <p className="text-[10px] text-zinc-400 font-retro tracking-widest mt-1.5 uppercase">ALPHA DETECT</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Car visual display */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-300 rounded-2xl border-4 border-slate-400 p-4 aspect-[4/3] flex flex-col justify-between relative shadow-inner">
            <div className="w-full h-full bg-neutral-900 border-4 border-neutral-800 rounded-lg overflow-hidden relative crt-screen">
              
              {/* Visible Vehicle Display */}
              <img
                src={currentQuestionCar.imageUrl}
                alt="Identify this vehicle"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover saturate-110 brightness-95 select-none"
              />

              {/* Retro alignment overlay */}
              <div className="absolute inset-0 border-2 border-dashed border-sky-500/20 pointer-events-none" />
              <div className="absolute top-2 left-2 bg-black/80 text-[8px] font-retro px-2 py-0.5 rounded text-sky-400">
                {selectedAnswer !== null ? "REVEALED" : "CLASSIFIED VEHICLE"}
              </div>

              {/* Correct / Wrong HUD indicator overlay */}
              {selectedAnswer !== null && (
                <div className={`absolute inset-0 flex items-center justify-center z-10 ${isCorrect ? "bg-emerald-950/80" : "bg-red-950/80"}`}>
                  <span className={`text-base font-retro tracking-widest font-extrabold uppercase animate-bounce ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                    {isCorrect ? "CORRECT MATCH!" : "MISMATCH!"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Choices and helpful mechanical logs */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-4">
          <div className="space-y-4 flex-1">
            <h3 className="text-zinc-200 text-xs font-retro uppercase flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-red-500" />
              IDENTIFY THE RETRO VEHICLE:
            </h3>

            {/* Hint Registry Panel */}
            <div className="border-2 border-zinc-900 bg-neutral-900/60 p-4 rounded-2xl relative space-y-3 leading-relaxed">
              <p className="text-[10px] font-retro text-zinc-500 uppercase">
                MECHANICAL DIAGNOSTIC CLUES
              </p>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-zinc-850 pb-1.5">
                  <span className="text-zinc-500">CATEGORY CLASS:</span>
                  <span className="text-zinc-300 font-bold uppercase">{currentQuestionCar.category}</span>
                </div>

                {hintLevel >= 1 ? (
                  <div className="flex justify-between border-b border-zinc-850 pb-1.5 text-amber-500">
                    <span>GEOGRAPHIC ORIGIN COUNTRY:</span>
                    <span className="font-bold capitalize">{currentQuestionCar.history.originCountry}</span>
                  </div>
                ) : (
                  <button 
                    onClick={triggerNextHint}
                    className="cursor-pointer text-[10px] text-amber-500 font-retro hover:underline tracking-tight uppercase"
                  >
                    + REVEAL GEOGRAPHIC REGION CLUE
                  </button>
                )}

                {hintLevel >= 2 ? (
                  <div className="flex justify-between border-b border-zinc-850 pb-1.5 text-emerald-400">
                    <span>HORSEPOWER SPECIFICATION:</span>
                    <span className="font-bold">{currentQuestionCar.stats.horsepower} HP CRANK</span>
                  </div>
                ) : (
                  hintLevel >= 1 && (
                    <button 
                      onClick={triggerNextHint}
                      className="cursor-pointer text-[10px] text-emerald-400 font-retro hover:underline tracking-tight uppercase block"
                    >
                      + REVEAL POWER RATING SPEC CLUE
                    </button>
                  )
                )}

                {hintLevel >= 3 ? (
                  <div className="text-sky-400 border-none pt-1">
                    <span className="block text-zinc-500 text-[9px] font-retro mb-1">CULTURAL MOTIF CLUE:</span>
                    <p className="italic leading-snug font-sans text-[13px]">{currentQuestionCar.history.eraCulture}</p>
                  </div>
                ) : (
                  hintLevel >= 2 && (
                    <button 
                      onClick={triggerNextHint}
                      className="cursor-pointer text-[10px] text-sky-400 font-retro hover:underline tracking-tight uppercase block"
                    >
                      + REVEAL HISTORIC ERA CULTURE CLUE
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Grid options choices keys */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {options.map((opt, idx) => {
                const isSelected = selectedAnswer === opt;
                const isCorrectAns = opt === `${currentQuestionCar.brand} ${currentQuestionCar.name}`;
                
                let buttonStyle = "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white";
                
                if (selectedAnswer !== null) {
                  if (isCorrectAns) {
                    buttonStyle = "bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                  } else if (isSelected && !isCorrect) {
                    buttonStyle = "bg-red-950/60 border-red-500 text-red-300 font-bold";
                  } else {
                    buttonStyle = "bg-zinc-950 border-zinc-900 text-zinc-600 cursor-not-allowed";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelection(opt)}
                    disabled={selectedAnswer !== null}
                    className={`cursor-pointer min-h-12 border-2 p-3 rounded-xl font-mono text-xs text-left transition-all uppercase ${buttonStyle}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{opt}</span>
                      <span className="text-[8px] font-retro text-zinc-600">KEY {idx + 1}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Footer switch buttons */}
          {selectedAnswer !== null && (
            <div className="pt-4 border-t border-zinc-905 flex justify-end">
              <button
                onClick={() => {
                  sfx.playSuccess();
                  startNewRound();
                }}
                className="cursor-pointer bg-red-600 hover:bg-red-700 border-2 border-red-500 text-white font-retro text-[10px] tracking-widest px-5 py-2.5 rounded-xl flex items-center gap-2 uppercase active:scale-95"
              >
                NEXT MATCH
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
