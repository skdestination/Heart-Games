const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

code = code.replace('  }, [lastWaterIntakeTime])  // Reset daily items if the day has changed', '  }, [lastWaterIntakeTime]);\n\n  // Reset daily items if the day has changed');
code = code.replace('  }, [partnership?.id, dailyItems]);]);', '  }, [partnership?.id, dailyItems]);');

fs.writeFileSync('src/components/UserDashboard.tsx', code);
console.log("Patched successfully");
