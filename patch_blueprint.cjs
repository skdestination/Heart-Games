const fs = require('fs');
let code = fs.readFileSync('firebase-blueprint.json', 'utf8');

const target = `        "reminderInterval": { "type": "string" }
      },
      "required": ["title", "rewardHearts", "status", "assigneeId", "createdAt", "updatedAt"]`;
const replacement = `        "reminderInterval": { "type": "string" },
        "approvalType": { "type": "string", "enum": ["manual", "automatic"] },
        "deadline": { "type": "string" },
        "penaltyApplied": { "type": "boolean" }
      },
      "required": ["title", "rewardHearts", "status", "assigneeId", "createdAt", "updatedAt"]`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('firebase-blueprint.json', code);
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
