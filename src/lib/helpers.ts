
export const getLevelInfo = (hearts: number) => {
    const thresholds = [10, 30, 80];
    let level = 1;
    let progressHearts = hearts;
    let requiredHearts = thresholds[0];

    for (let i = 0; i < thresholds.length; i++) {
      if (hearts >= thresholds[i]) {
        level = i + 2;
        progressHearts = hearts - thresholds[i];
        requiredHearts = (i + 1 < thresholds.length) ? (thresholds[i+1] - thresholds[i]) : 100;
      } else {
        break;
      }
    }

    if (hearts >= 80) {
      const heartsAbove80 = hearts - 80;
      level = 4 + Math.floor(heartsAbove80 / 100);
      progressHearts = heartsAbove80 % 100;
      requiredHearts = 100;
    }
    
    return { level, progressHearts, requiredHearts };
};
