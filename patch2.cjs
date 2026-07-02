const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const target = `                  )}
                </div>        </div>
              </div>`;
const replacement = `                  )}
                </div>
              </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/UserDashboard.tsx', code);
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
