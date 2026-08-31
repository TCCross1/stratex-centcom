import fs from "node:fs/promises";
import path from "node:path";

const REGISTRY_PATH = path.resolve(process.cwd(), ".stratex", "qualification", "registry.json");

export const qualificationPersistenceEnabled = () => {
  const value = String(process.env.STRATEX_QUALIFICATION_PERSIST || "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
};

export const qualificationRegistryPath = () => REGISTRY_PATH;

export const readQualificationRegistry = async () => {
  if (!qualificationPersistenceEnabled()) return null;
  try {
    const raw = await fs.readFile(REGISTRY_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const writeQualificationRegistry = async (payload) => {
  if (!qualificationPersistenceEnabled()) return;
  await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(payload, null, 2), "utf8");
};

export const defaultQualificationRegistry = () => ({
  evidence: {
    packages: [], assets: [], quality: [], coverage: [], jobs: [], custody: [], manifests: [], events: [], audit: [],
  },
  reality: {
    models: [], versions: [], artifacts: [], thermal: [], roof: [], measurements: [], quality: [], layers: [], comparisons: [], changes: [], jobs: [], manifests: [], qualificationDatasets: [], events: [], audit: [],
  },
  version: 1,
});

export const hydrateQualificationRegistry = (base = defaultQualificationRegistry(), incoming = null) => {
  const source = incoming || base || defaultQualificationRegistry();
  const result = { ...defaultQualificationRegistry(), ...(base || {}), ...(source || {}) };
  result.evidence = { ...defaultQualificationRegistry().evidence, ...(base?.evidence || {}), ...(source?.evidence || {}) };
  result.reality = { ...defaultQualificationRegistry().reality, ...(base?.reality || {}), ...(source?.reality || {}) };
  return result;
};

export const mergeQualificationRegistry = async (partial) => {
  if (!qualificationPersistenceEnabled()) return null;
  const current = (await readQualificationRegistry()) || defaultQualificationRegistry();
  const merged = hydrateQualificationRegistry(current, partial);
  await writeQualificationRegistry(merged);
  return merged;
};
