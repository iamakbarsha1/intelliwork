/**
 * Gamification Logic
 * 
 * Levels, points, and achievements calculation.
 */

export interface LevelData {
  level: number;
  points: number;
  nextLevelPoints: number;
  title: string;
  progress: number;
}

export function calculateLevel(totalPoints: number): LevelData {
  // Simple level formula: Level 1 = 0, Level 2 = 1000, Level 3 = 2500, etc.
  // We'll use a more linear progression for this demo: Level = floor(sqrt(points / 100)) + 1
  const level = Math.floor(Math.sqrt(totalPoints / 100)) + 1;
  const currentLevelPoints = Math.pow(level - 1, 2) * 100;
  const nextLevelPoints = Math.pow(level, 2) * 100;
  
  const pointsInCurrentLevel = totalPoints - currentLevelPoints;
  const pointsRequiredForNext = nextLevelPoints - currentLevelPoints;
  const progress = (pointsInCurrentLevel / pointsRequiredForNext) * 100;

  const titles = [
    "Apprentice",
    "Novice",
    "Acolyte",
    "Journeyman",
    "Craftsman",
    "Expert",
    "Master",
    "Grandmaster",
    "Legend",
    "Transcendent"
  ];

  const title = titles[Math.min(level - 1, titles.length - 1)];

  return {
    level,
    points: totalPoints,
    nextLevelPoints,
    title,
    progress
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "deep-diver",
    title: "Deep Diver",
    description: "4 hours of deep work in a single day",
    unlocked: true,
    icon: "🌊",
    rarity: "rare"
  },
  {
    id: "focus-master",
    title: "Focus Master",
    description: "Maintain a focus score above 90 for 2 hours",
    unlocked: false,
    icon: "🧘",
    rarity: "epic"
  },
  {
    id: "early-bird",
    title: "Early Bird",
    description: "Start your first deep work session before 8:00 AM",
    unlocked: true,
    icon: "🌅",
    rarity: "common"
  },
  {
    id: "zen-mode",
    title: "Zen Mode",
    description: "0 context switches for 1 hour",
    unlocked: false,
    icon: "⛩️",
    rarity: "legendary"
  }
];
