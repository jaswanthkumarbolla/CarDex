import React from "react";
import { motion } from "motion/react";

export const LEFT_CARS: PixelCar[] = [
  {
    name: "M4",
    brand: "BMW",
    imageUrl: "leftbmw.jpg",
    style: {
      top: "3%",
      left: "-8%",
      transform: "rotate(-12deg) scale(1.15)",
    },
  },
  {
    name: "Huracan",
    brand: "Lamborghini",
    imageUrl: "leftlambolol.jpg",
    style: {
      top: "19%",
      left: "-11%",
      transform: "rotate(15deg) scale(1.2)",
    },
  },
  {
    name: "Chiron",
    brand: "Buggati",
    imageUrl: "buggati.png",
    style: {
      top: "35%",
      left: "-12%",
      transform: "rotate(-8deg) scale(1.25)",
    },
  },
  {
    name: "F40",
    brand: "Ferrari",
    imageUrl: "leftferrari.png",
    style: {
      top: "51%",
      left: "-10%",
      transform: "rotate(10deg) scale(1.2)",
    },
  },
  {
    name: "Skyline R34",
    brand: "NISSAN",
    imageUrl: "left1.png",
    style: {
      top: "67%",
      left: "-13%",
      transform: "rotate(14deg) scale(1.15)",
    },
  },
  {
    name: "Camaro",
    brand: "Chevrolet",
    imageUrl: "left3lol.png",
    style: {
      top: "83%",
      left: "-11%",
      transform: "rotate(-18deg) scale(1.3)",
    },
  },
];

export const RIGHT_CARS: PixelCar[] = [
  {
    name: "LaFerrari",
    brand: "FERRARI",
    imageUrl: "right1.png",
    style: {
      top: "11%",
      right: "-11%",
      transform: "rotate(10deg) scale(1.15)",
    },
  },
  {
    name: "Aventador SVJ",
    brand: "LAMBORGHINI",
    imageUrl: "right2lol.png",
    style: {
      top: "27%",
      right: "-9%",
      transform: "rotate(-14deg) scale(1.2)",
    },
  },
  {
    name: "NSX Type R",
    brand: "HONDA",
    imageUrl: "right3.png",
    style: {
      top: "43%",
      right: "-10%",
      transform: "rotate(12deg) scale(1.2)",
    },
  },
  {
    name: "F40 LM",
    brand: "FERRARI",
    imageUrl: "right4.png",
    style: {
      top: "59%",
      right: "-10%",
      transform: "rotate(-12deg) scale(1.25)",
    },
  },
  {
    name: "McLaren F1",
    brand: "MCLAREN",
    imageUrl: "right5.png",
    style: {
      top: "75%",
      right: "-9%",
      transform: "rotate(15deg) scale(1.15)",
    },
  },
  {
    name: "Diablo SV",
    brand: "LAMBORGHINI",
    imageUrl: "right6.png",
    style: {
      top: "91%",
      right: "-10%",
      transform: "rotate(-15deg) scale(1.15)",
    },
  },
];

// Combines left and right side lists for unified rendering mapping
export const BACKGROUND_CARS: PixelCar[] = [...LEFT_CARS, ...RIGHT_CARS];

export interface PixelCar {
  name: string;
  brand: string;
  imageUrl: string;
  style: React.CSSProperties;
}

export const PixelSupercarsBackground: React.FC = () => {
  const [scrollY, setScrollY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black pointer-events-none select-none">
      {/* Ambient Darkened CRT overlay */}
      <div className="absolute inset-0 bg-neutral-950/25 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.22)_50%)] bg-[length:100%_4px] pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.98)] pointer-events-none" />

      {/* Floating Pictures mapped in grid space - hidden only on tiny mobile screens, visible everywhere else */}
      <div className="hidden sm:block w-full h-full relative">
        {BACKGROUND_CARS.map((car, idx) => {
          // Vary the parallax speed slightly across cards so they move organically at different rates!
          const parallaxSpeed = 0.08 + (idx % 4) * 0.06; // 0.08, 0.14, 0.20, 0.26
          const parallaxOffset = scrollY * parallaxSpeed;

          // Compute wrapperStyle focusing on top/bottom/left/right properties
          const wrapperStyle: React.CSSProperties = {
            position: "absolute",
            top: car.style?.top,
            bottom: car.style?.bottom,
            left: car.style?.left,
            right: car.style?.right,
            transform: `translateY(${-parallaxOffset}px)`,
            transition: "transform 0.15s cubic-bezier(0.1, 0.8, 0.2, 1)", // Beautiful fluid inertia effect
          };

          const cardStyle: React.CSSProperties = {
            imageRendering: "pixelated",
          };

          // Vary floating speeds across different cards so they animate asynchronously
          const floatClass = idx % 3 === 0 ? "animate-float-1" : idx % 3 === 1 ? "animate-float-2" : "animate-float-3";

          return (
            <div key={idx} style={wrapperStyle} className="pointer-events-none">
              <motion.div
                className="w-48 h-28 md:w-72 md:h-44 rounded-2xl border-4 border-zinc-900 bg-neutral-950 overflow-hidden shadow-2xl filter brightness-95 contrast-125 select-none"
                style={cardStyle}
                initial={{ 
                  opacity: 0, 
                  y: -140, 
                  scale: 0.75,
                  rotate: (idx % 2 === 0 ? -12 : 12)
                }}
                animate={{ 
                  opacity: 0.7, 
                  y: 0, 
                  scale: 1, 
                  rotate: car.style?.transform 
                    ? parseFloat(car.style.transform.match(/rotate\(([^deg)]+)/)?.[1] || "0") 
                    : 0
                }}
                transition={{
                  duration: 1.6,
                  delay: idx * 0.08, // Staggered delays create a beautiful wave waterfall of falling supercars
                  ease: [0.16, 1, 0.3, 1], // Fluid premium cubic-bezier preset
                }}
              >
                {/* Inner floating container for gentle atmospheric float */}
                <div className={`w-full h-full relative ${floatClass}`}>
                  {/* Vintage glowing pixel overlays */}
                  <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/85" />
                  <div className="absolute inset-0 z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.50)_50%)] bg-[length:100%_6px]" />
                  
                  <img
                    src={car.imageUrl}
                    alt={car.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover saturate-125 filter pointer-events-none"
                    style={{
                      imageRendering: "pixelated",
                    }}
                  />
                  
                  {/* Image only, text watermark removed */}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
