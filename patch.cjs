const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const target = `                  <span className="text-xs text-rose-400 font-black bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                    {dailyItems.filter(i => i.completed).length} / {dailyItems.length} Completed
                  </span>
                          <div className="space-y-2.5">`;
const replacement = `                  <span className="text-xs text-rose-400 font-black bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                    {dailyItems.filter(i => i.completed).length} / {dailyItems.length} Completed
                  </span>
                </div>

                <div className="space-y-2.5">`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/UserDashboard.tsx', code);
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
