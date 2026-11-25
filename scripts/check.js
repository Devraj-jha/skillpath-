import assert from 'node:assert/strict';
import { calculateAssessment } from '../lib/matching.js';
import { buildRecommendations } from '../lib/recommendations.js';

const skills = [
  { id: 'js', name: 'JavaScript', category: 'Programming' },
  { id: 'sql', name: 'SQL', category: 'Database' }
];
const role = {
  id: 'test-role', title: 'Test role', skills: [
    { skillId: 'js', required: 2, weight: 2 },
    { skillId: 'sql', required: 2, weight: 1 }
  ]
};
const result = calculateAssessment({ skills: { js: 2, sql: 1 } }, role, skills);
assert.equal(result.match, 83);
assert.equal(result.counts.possessed, 1);
assert.equal(result.counts.improve, 1);
assert.equal(result.counts.missing, 0);
const missing = calculateAssessment({ skills: {} }, role, skills);
assert.equal(missing.match, 0);
assert.equal(missing.counts.missing, 2);
const recommendations = buildRecommendations(missing, [], role);
assert.equal(recommendations.length, 2);
assert.equal(recommendations[0].status, 'missing');
console.log('SkillPath checks passed: weighted scoring, zero-level handling and recommendation ordering.');
