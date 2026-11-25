export function calculateAssessment(profile, role, skillCatalog = []) {
  if (!role || !Array.isArray(role.skills) || role.skills.length === 0) {
    throw new Error('This career role does not have a valid skill profile yet.');
  }
  const current = profile?.skills && typeof profile.skills === 'object' ? profile.skills : {};
  const catalog = new Map(skillCatalog.map(skill => [skill.id, skill]));
  let weighted = 0;
  let totalWeight = 0;
  const comparisons = role.skills.map(item => {
    const required = Math.max(0, Math.min(3, Number(item.required) || 0));
    const level = Math.max(0, Math.min(3, Number(current[item.skillId]) || 0));
    const weight = Math.max(0.01, Number(item.weight) || 1);
    const contribution = required === 0 ? 1 : Math.min(level / required, 1);
    weighted += contribution * weight;
    totalWeight += weight;
    const status = level === 0 ? 'missing' : level < required ? 'improve' : 'possessed';
    return {
      skillId: item.skillId,
      name: catalog.get(item.skillId)?.name || item.skillId,
      category: catalog.get(item.skillId)?.category || 'Other',
      current: level,
      required,
      weight,
      contribution: Math.round(contribution * 100),
      status,
      why: item.why || ''
    };
  });
  const match = totalWeight ? Math.round((weighted / totalWeight) * 100) : 0;
  const counts = comparisons.reduce((acc, item) => {
    acc[item.status] += 1;
    return acc;
  }, { possessed: 0, improve: 0, missing: 0 });
  return {
    id: `assessment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    roleId: role.id,
    roleTitle: role.title,
    match,
    counts,
    comparisons,
    createdAt: new Date().toISOString(),
    formula: 'Σ(weight × min(current level / required level, 1)) ÷ Σ(weight) × 100'
  };
}
