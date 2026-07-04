function seedRandom(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const r = ((h ^= h >>> 16) >>> 0) / 4294967296;
    return r;
  };
}

export const getThresholdsForPartnership = (partnershipId: string | undefined): number[] => {
  const seed = partnershipId || 'default_heartgoals_seed';
  const rand = seedRandom(seed);
  const thresholds: number[] = [10, 30, 80];
  let currentTotal = 80;
  
  // Generate subsequent thresholds from level 4 (80 hearts) onwards
  for (let i = 3; i < 1000; i++) {
    const choices = [30, 40, 50];
    const r = Math.floor(rand() * choices.length);
    const increment = choices[r];
    currentTotal += increment;
    thresholds.push(currentTotal);
  }
  return thresholds;
};

export const getLevelInfo = (hearts: number, partnershipId?: string) => {
  const thresholds = getThresholdsForPartnership(partnershipId);
  let level = 1;
  let progressHearts = hearts;
  let requiredHearts = thresholds[0]; // Hearts needed within Level 1 to reach Level 2 (10)
  let nextLevelTarget = thresholds[0]; // Total hearts needed to reach Level 2 (10)
  let currentLevelStart = 0; // Total hearts at which current level started
  
  for (let i = 0; i < thresholds.length; i++) {
    if (hearts >= thresholds[i]) {
      level = i + 2;
      currentLevelStart = thresholds[i];
      progressHearts = hearts - currentLevelStart;
      const nextThreshold = thresholds[i + 1] || (thresholds[i] + 40);
      requiredHearts = nextThreshold - thresholds[i];
      nextLevelTarget = nextThreshold;
    } else {
      break;
    }
  }
  
  if (progressHearts < 0) {
    progressHearts = 0;
  }
  
  return { level, progressHearts, requiredHearts, nextLevelTarget, currentLevelStart };
};
