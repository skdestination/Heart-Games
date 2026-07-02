const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

const target3 = `(get(/databases/$(database)/documents/partnerships/$(partnershipId)).data.userId == request.auth.uid && incoming().diff(existing()).affectedKeys().hasOnly(['status', 'updatedAt']) && incoming().status == 'completed')`;

const replace3 = `(get(/databases/$(database)/documents/partnerships/$(partnershipId)).data.userId == request.auth.uid && incoming().diff(existing()).affectedKeys().hasOnly(['status', 'updatedAt', 'penaltyApplied']) && incoming().status in ['pending', 'completed', 'approved', 'failed'])`;

if (code.includes(target3)) {
  code = code.replace(target3, replace3);
  fs.writeFileSync('firestore.rules', code);
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
