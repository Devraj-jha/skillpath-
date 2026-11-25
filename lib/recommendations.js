const activityByStatus = {
  missing: {
    action: 'Start with the fundamentals',
    kind: 'Learn',
    project: 'Create a tiny first-principles exercise',
    note: 'Build a small, focused example before moving to a larger project.'
  },
  improve: {
    action: 'Strengthen through deliberate practice',
    kind: 'Practice',
    project: 'Build a feature that uses this skill',
    note: 'Practice the concept in a realistic, bounded task.'
  },
  possessed: {
    action: 'Apply it in a portfolio project',
    kind: 'Build',
    project: 'Demonstrate the skill in a shipped project',
    note: 'Keep this skill fresh by using it in a project with evidence.'
  }
};

export function buildRecommendations(assessment, resources = [], role = null) {
  if (!assessment) return [];
  const resourcesBySkill = new Map();
  for (const resource of resources) {
    const list = resourcesBySkill.get(resource.skillId) || [];
    list.push(resource);
    resourcesBySkill.set(resource.skillId, list);
  }
  return assessment.comparisons
    .slice()
    .sort((a, b) => ({ missing: 0, improve: 1, possessed: 2 }[a.status] - { missing: 0, improve: 1, possessed: 2 }[b.status]) || b.weight - a.weight)
    .map(item => {
      const meta = activityByStatus[item.status];
      const matching = resourcesBySkill.get(item.skillId) || [];
      const pick = matching.find(resource => item.status === 'missing' ? resource.level === 'Foundation' : item.status === 'improve' ? resource.level !== 'Foundation' : true) || matching[0];
      return {
        skillId: item.skillId,
        skill: item.name,
        status: item.status,
        importance: item.weight,
        action: meta.action,
        kind: pick?.kind || meta.kind,
        resource: pick || null,
        project: meta.project,
        note: meta.note,
        roleTitle: role?.title || assessment.roleTitle
      };
    });
}
