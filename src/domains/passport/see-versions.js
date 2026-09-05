/**
 * Persisted Cortex See versions. getByProperty is otherwise rebuilt from
 * fixtures on every read; this store is the only place a See commit survives.
 */
const versionsByProperty = new Map();

export function appendSeeVersion(propertyId, version) {
  if (!propertyId) throw new Error("propertyId is required to append a See version.");
  if (!version?.revisionId) throw new Error("See version requires a revisionId.");
  const next = [...(versionsByProperty.get(propertyId) || []), version];
  versionsByProperty.set(propertyId, next);
  return version;
}

export function listSeeVersions(propertyId) {
  if (!propertyId) return [];
  return [...(versionsByProperty.get(propertyId) || [])];
}
