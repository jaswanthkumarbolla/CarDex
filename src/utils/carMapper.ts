import { CarDexEntry, CarDetectionResult, CarStats, RestorationInsight } from "../types";

/**
 * Maps a Gemini vision detection result to a fully featured CarDexEntry.
 *
 * @param result The recognized car properties from Gemini
 * @param imageUrl The visual asset URL (usually the base64 scanned data)
 * @returns A compliant CarDexEntry populated with realistic specs, history, and restoration data
 */
export function mapDetectionToEntry(
  result: CarDetectionResult,
  imageUrl: string
): CarDexEntry {
  const { make, model, trim, generation, year, confidence } = result;
  const brand = make || "Unknown Brand";
  const carName = `${model} ${trim || ""}`.trim() || "Unknown Model";
  const carYear = year || new Date().getFullYear();

  // Determine Category based on brand and age
  let category: CarDexEntry["category"] = "Tuned Cult";
  const brandLower = brand.toLowerCase();

  const jdmBrands = ["toyota", "nissan", "honda", "mazda", "subaru", "mitsubishi", "lexus", "acura", "infiniti", "suzuki", "daihatsu"];
  const muscleBrands = ["ford", "chevrolet", "dodge", "pontiac", "plymouth", "buick", "cadillac", "lincoln"];
  const exoticBrands = ["ferrari", "lamborghini", "porsche", "mclaren", "aston martin", "bugatti", "pagani", "koenigsegg", "audi", "bmw"];

  if (carYear < 1980) {
    category = "Classic Vintage";
  } else if (jdmBrands.some((b) => brandLower.includes(b))) {
    category = "JDM";
  } else if (muscleBrands.some((b) => brandLower.includes(b))) {
    category = "Muscle";
  } else if (exoticBrands.some((b) => brandLower.includes(b))) {
    category = "Exotic";
  }

  // Determine Rarity based on confidence/make
  let rarity: CarDexEntry["rarity"] = "Common";
  if (category === "Exotic" || confidence > 85) {
    rarity = "Legendary";
  } else if (confidence > 70) {
    rarity = "Rare";
  } else if (confidence > 50) {
    rarity = "Rare";
  }

  // Generate dynamic, realistic specs based on the category
  let stats: CarStats;
  let restoration: RestorationInsight;
  let originCountry = "Unknown";
  let eraCulture = "Contemporary automotive landscape.";
  let legendaryFact = `The ${brand} ${model} is a remarkable machine known for its design, engineering, and driving dynamics.`;
  let notableDriverOrRace = "Privateer Tuner Custom Build";

  switch (category) {
    case "JDM":
      stats = {
        topSpeedMph: 155,
        zeroToSixtyS: 5.1,
        horsepower: 276,
        torqueLbFt: 280,
        weightLbs: 3350,
        engineType: "2.5L Inline-6 Twin-Turbo",
        transmission: "6-Speed Manual",
      };
      restoration = {
        difficultyRating: 65,
        partsAvailability: "Abundant - Huge aftermarket catalog and OEM heritage support",
        commonIssues: [
          {
            id: "issue-1",
            component: "Turbocharger Seals",
            description: "Aging seals can lead to oil blow-by under high boost.",
            difficulty: "Medium",
            rarityOfParts: "Abundant",
            fixed: false,
          },
          {
            id: "issue-2",
            component: "Vacuum Hose Nest",
            description: "Intricate twin-turbo vacuum lines dry rot and cause boost leaks.",
            difficulty: "Hard",
            rarityOfParts: "Moderate",
            fixed: false,
          },
        ],
        proRestorationTip: "Swap rubber vacuum lines with silicone hoses and inspect the twin-turbo intercooler couplers.",
      };
      originCountry = "Japan";
      eraCulture = "The golden age of 90s street racers and midnight highway loops.";
      legendaryFact = `Known globally as a prime canvas for tuners, this generation of the ${model} defined the custom JDM culture.`;
      notableDriverOrRace = "Keiichi Tsuchiya (The Drift King)";
      break;

    case "Muscle":
      stats = {
        topSpeedMph: 160,
        zeroToSixtyS: 4.6,
        horsepower: 420,
        torqueLbFt: 400,
        weightLbs: 3750,
        engineType: "5.0L Naturally Aspirated V8",
        transmission: "6-Speed Manual",
      };
      restoration = {
        difficultyRating: 45,
        partsAvailability: "Abundant - Crate engines and suspension components are widely sourced",
        commonIssues: [
          {
            id: "issue-1",
            component: "Leaf Spring Bushings",
            description: "Dry-rotted rubber bushings cause axle wrap and poor launch control.",
            difficulty: "Easy",
            rarityOfParts: "Abundant",
            fixed: false,
          },
          {
            id: "issue-2",
            component: "Carburetor Sync/Fuel Pump",
            description: "Mechanical fuel pumps often leak or lose pressure under heat soak.",
            difficulty: "Medium",
            rarityOfParts: "Abundant",
            fixed: false,
          },
        ],
        proRestorationTip: "Install polyuretahne bushings to eliminate wheel hop and add a heat shield to the fuel lines.",
      };
      originCountry = "United States";
      eraCulture = "Quarter-mile drag strip dominance and heavy raw displacement.";
      legendaryFact = `The ${model} model is a certified piece of American asphalt history, embodying tire-shredding performance.`;
      notableDriverOrRace = "Ken Miles / NHRA Championships";
      break;

    case "Exotic":
      stats = {
        topSpeedMph: 205,
        zeroToSixtyS: 3.1,
        horsepower: 610,
        torqueLbFt: 450,
        weightLbs: 3150,
        engineType: "3.8L Twin-Turbo Flat-6",
        transmission: "7-Speed Dual-Clutch (PDK)",
      };
      restoration = {
        difficultyRating: 85,
        partsAvailability: "Scarce - Specialty exotic supply chains with high lead times",
        commonIssues: [
          {
            id: "issue-1",
            component: "Active Aero Dampers",
            description: "Complex hydraulic spoiler actuators tend to fail or leak fluid.",
            difficulty: "Expert",
            rarityOfParts: "Scarce",
            fixed: false,
          },
          {
            id: "issue-2",
            component: "Carbon Ceramic Rotors",
            description: "Extremely expensive to replace if heat-cycled beyond spec limits.",
            difficulty: "Hard",
            rarityOfParts: "Extremely Rare",
            fixed: false,
          },
        ],
        proRestorationTip: "Always use dedicated diagnostics suites to bleed the active suspension and check clutch wear indices.",
      };
      originCountry = "Europe";
      eraCulture = "High-society track days and advanced wind-tunnel computational design.";
      legendaryFact = `This supercar model was engineered with lightweight aerospace alloys and computer-guided active aerodynamics.`;
      notableDriverOrRace = "Nürburgring Nordschleife Lap Record Holder";
      break;

    case "Classic Vintage":
      stats = {
        topSpeedMph: 110,
        zeroToSixtyS: 8.5,
        horsepower: 140,
        torqueLbFt: 165,
        weightLbs: 2600,
        engineType: "2.0L Carbureted Inline-4",
        transmission: "4-Speed Manual",
      };
      restoration = {
        difficultyRating: 55,
        partsAvailability: "Moderate - Sourced from specialized vintage collectors and swap meets",
        commonIssues: [
          {
            id: "issue-1",
            component: "Carburetor Floats",
            description: "Brass or foam floats saturate with modern ethanol fuel and flood the engine.",
            difficulty: "Easy",
            rarityOfParts: "Abundant",
            fixed: false,
          },
          {
            id: "issue-2",
            component: "Points Ignition",
            description: "Distributor contact points wear out, shifting the ignition timing.",
            difficulty: "Easy",
            rarityOfParts: "Moderate",
            fixed: false,
          },
        ],
        proRestorationTip: "Consider upgrading to an electronic ignition module inside the stock distributor body for modern reliability.",
      };
      originCountry = "International Heritage";
      eraCulture = "An era of mechanical purism, where driver feel surpassed electronics.";
      legendaryFact = `An elegant historical cruiser, this ${model} represents the hand-crafted automotive design paradigm.`;
      notableDriverOrRace = "Historic Monte Carlo Rally Class winner";
      break;

    default:
      stats = {
        topSpeedMph: 145,
        zeroToSixtyS: 6.2,
        horsepower: 240,
        torqueLbFt: 220,
        weightLbs: 3200,
        engineType: "2.0L Inline-4 Turbocharged",
        transmission: "6-Speed Manual",
      };
      restoration = {
        difficultyRating: 50,
        partsAvailability: "Abundant - Fully integrated into standard automotive parts chains",
        commonIssues: [
          {
            id: "issue-1",
            component: "Serpentine Belt",
            description: "Squeals on cold startup due to worn auto-tensioner pivot.",
            difficulty: "Easy",
            rarityOfParts: "Abundant",
            fixed: false,
          },
          {
            id: "issue-2",
            component: "PCV Valve Diaphragm",
            description: "Worn PCV causes vacuum imbalance and minor oil usage.",
            difficulty: "Easy",
            rarityOfParts: "Abundant",
            fixed: false,
          },
        ],
        proRestorationTip: "Always replace the belt tensioner along with the belt to ensure uniform seating.",
      };
  }

  // Refine specific fields with real detection info
  if (year) {
    stats.engineType = `${year} Spec ` + (stats.engineType || "");
  }

  const description = `The recognized ${brand} ${model}${trim ? " " + trim : ""}${generation ? " (" + generation + ")" : ""} represents a distinct milestone in automotive heritage. This model features precise chassis control, custom tuner capabilities, and a distinct aesthetic footprint. With an analyzed camera scan confidence rating of ${confidence}%, this vehicle registry has been securely uploaded to the satellite-linked CarDex database.`;

  return {
    dexId: Math.floor(Math.random() * 900 + 100).toString(), // random 3-digit id
    name: carName,
    brand,
    year: carYear,
    category,
    rarity,
    description,
    imageUrl,
    stats,
    restoration,
    history: {
      originCountry,
      eraCulture,
      legendaryFact,
      notableDriverOrRace,
    },
    features: [
      generation ? `Generation: ${generation}` : "",
      trim ? `Trim Package: ${trim}` : "",
      "Analyzed by AI Vision Uplink",
    ].filter(Boolean),
    confidence,
  };
}
