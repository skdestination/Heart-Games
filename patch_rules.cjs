const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

const target1 = `    function isValidTask(data) {
      return data.keys().hasAll(['title', 'description', 'rewardHearts', 'status', 'assigneeId', 'createdAt', 'updatedAt']) &&
             data.keys().size() <= 9 &&
             data.title is string && data.title.size() <= 200 &&
             data.description is string && data.description.size() <= 1000 &&
             data.rewardHearts is number &&
             data.status is string && data.status in ['pending', 'completed', 'approved'] &&
             data.assigneeId is string && data.assigneeId.size() <= 128 &&
             (data.get('reminderCount', null) == null || data.get('reminderCount', 0) is number) &&
             (data.get('reminderInterval', null) == null || (data.get('reminderInterval', '') is string && data.get('reminderInterval', '').size() <= 100)) &&
             data.createdAt == request.time &&
             data.updatedAt == request.time;
    }`;

const replace1 = `    function isValidTask(data) {
      return data.keys().hasAll(['title', 'description', 'rewardHearts', 'status', 'assigneeId', 'createdAt', 'updatedAt']) &&
             data.keys().size() <= 13 &&
             data.title is string && data.title.size() <= 200 &&
             data.description is string && data.description.size() <= 1000 &&
             data.rewardHearts is number &&
             data.status is string && data.status in ['pending', 'completed', 'approved', 'failed'] &&
             data.assigneeId is string && data.assigneeId.size() <= 128 &&
             (data.get('reminderCount', null) == null || data.get('reminderCount', 0) is number) &&
             (data.get('reminderInterval', null) == null || (data.get('reminderInterval', '') is string && data.get('reminderInterval', '').size() <= 100)) &&
             (data.get('approvalType', null) == null || data.get('approvalType', '') in ['manual', 'automatic']) &&
             (data.get('deadline', null) == null || data.get('deadline', '') is string) &&
             (data.get('penaltyApplied', null) == null || data.get('penaltyApplied', false) is bool) &&
             data.createdAt == request.time &&
             data.updatedAt == request.time;
    }`;

const target2 = `    function isValidTaskUpdate(data) {
      return data.keys().hasAll(['title', 'description', 'rewardHearts', 'status', 'assigneeId', 'createdAt', 'updatedAt']) &&
             data.keys().size() <= 9 &&
             data.title is string && data.title.size() <= 200 &&
             data.description is string && data.description.size() <= 1000 &&
             data.rewardHearts is number &&
             data.status is string && data.status in ['pending', 'completed', 'approved'] &&
             data.assigneeId is string && data.assigneeId.size() <= 128 &&
             (data.get('reminderCount', null) == null || data.get('reminderCount', 0) is number) &&
             (data.get('reminderInterval', null) == null || (data.get('reminderInterval', '') is string && data.get('reminderInterval', '').size() <= 100)) &&
             data.createdAt == existing().createdAt &&
             data.updatedAt == request.time;
    }`;

const replace2 = `    function isValidTaskUpdate(data) {
      return data.keys().hasAll(['title', 'description', 'rewardHearts', 'status', 'assigneeId', 'createdAt', 'updatedAt']) &&
             data.keys().size() <= 13 &&
             data.title is string && data.title.size() <= 200 &&
             data.description is string && data.description.size() <= 1000 &&
             data.rewardHearts is number &&
             data.status is string && data.status in ['pending', 'completed', 'approved', 'failed'] &&
             data.assigneeId is string && data.assigneeId.size() <= 128 &&
             (data.get('reminderCount', null) == null || data.get('reminderCount', 0) is number) &&
             (data.get('reminderInterval', null) == null || (data.get('reminderInterval', '') is string && data.get('reminderInterval', '').size() <= 100)) &&
             (data.get('approvalType', null) == null || data.get('approvalType', '') in ['manual', 'automatic']) &&
             (data.get('deadline', null) == null || data.get('deadline', '') is string) &&
             (data.get('penaltyApplied', null) == null || data.get('penaltyApplied', false) is bool) &&
             data.createdAt == existing().createdAt &&
             data.updatedAt == request.time;
    }`;

const target3 = `(get(/databases/$(database)/documents/partnerships/$(partnershipId)).data.adminId == request.auth.uid && incoming().diff(existing()).affectedKeys().hasOnly(['title', 'description', 'rewardHearts', 'status', 'updatedAt', 'reminderCount', 'reminderInterval'])) ||`;

const replace3 = `(get(/databases/$(database)/documents/partnerships/$(partnershipId)).data.adminId == request.auth.uid && incoming().diff(existing()).affectedKeys().hasOnly(['title', 'description', 'rewardHearts', 'status', 'updatedAt', 'reminderCount', 'reminderInterval', 'approvalType', 'deadline', 'penaltyApplied'])) ||`;

if (code.includes(target1) && code.includes(target2) && code.includes(target3)) {
  code = code.replace(target1, replace1).replace(target2, replace2).replace(target3, replace3);
  fs.writeFileSync('firestore.rules', code);
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
