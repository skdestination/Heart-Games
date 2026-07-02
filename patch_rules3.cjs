const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

const target4 = `return (pDoc.exists() && (pDoc.data.adminId == request.auth.uid || pDoc.data.userId == request.auth.uid)) || isAdmin();`;

const replace4 = `return (pDoc != null && (pDoc.data.adminId == request.auth.uid || pDoc.data.userId == request.auth.uid));`;

if (code.includes(target4)) {
  code = code.replace(target4, replace4);
  fs.writeFileSync('firestore.rules', code);
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
