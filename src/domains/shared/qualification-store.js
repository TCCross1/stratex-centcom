const isNodeRuntime = () =>
  typeof process !== "undefined" &&
  Boolean(process?.versions?.node);

const registryDirectory = () => {
  if (!isNodeRuntime()) return null;
  return `${process.cwd()}/.stratex/qualification`;
};

const registryPath = () => {
  const directory = registryDirectory();
  return directory ? `${directory}/registry.json` : null;
};

const loadNodeFs = async () => {
  if (!isNodeRuntime()) return null;

  const module = await import("node:fs/promises");
  return module.default || module;
};

export const qualificationPersistenceEnabled = () => {
  if (!isNodeRuntime() || !process?.env) return false;

  const value = String(
    process.env.STRATEX_QUALIFICATION_PERSIST || ""
  )
    .trim()
    .toLowerCase();

  return (
    value === "1" ||
    value === "true" ||
    value === "yes" ||
    value === "on"
  );
};

export const qualificationRegistryPath = () => registryPath();

export const readQualificationRegistry = async () => {
  if (!qualificationPersistenceEnabled()) return null;

  const fs = await loadNodeFs();
  const filePath = registryPath();

  if (!fs || !filePath) return null;

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const writeQualificationRegistry = async (payload) => {
  if (!qualificationPersistenceEnabled()) return;

  const fs = await loadNodeFs();
  const directory = registryDirectory();
  const filePath = registryPath();

  if (!fs || !directory || !filePath) return;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(
    filePath,
    JSON.stringify(payload, null, 2),
    "utf8"
  );
};

export const defaultQualificationRegistry = () => ({
  evidence: {
    packages: [],
    assets: [],
    quality: [],
    coverage: [],
    jobs: [],
    custody: [],
    manifests: [],
    events: [],
    audit: [],
  },
  reality: {
    models: [],
    versions: [],
    artifacts: [],
    thermal: [],
    roofs: [],
    measurements: [],
    quality: [],
    layers: [],
    comparisons: [],
    changes: [],
    jobs: [],
    manifests: [],
    qualificationDatasets: [],
    events: [],
    audit: [],
  },
  version: 1,
});

export const hydrateQualificationRegistry = (
  base = defaultQualificationRegistry(),
  incoming = null
) => {
  const source =
    incoming || base || defaultQualificationRegistry();

  const result = {
    ...defaultQualificationRegistry(),
    ...(base || {}),
    ...(source || {}),
  };

  result.evidence = {
    ...defaultQualificationRegistry().evidence,
    ...(base?.evidence || {}),
    ...(source.evidence || {}),
  };

  result.reality = {
    ...defaultQualificationRegistry().reality,
    ...(base?.reality || {}),
    ...(source.reality || {}),
  };

  return result;
};

export const mergeQualificationRegistry = async (partial) => {
  if (!qualificationPersistenceEnabled()) return null;

  const current =
    (await readQualificationRegistry()) ||
    defaultQualificationRegistry();

  const merged = hydrateQualificationRegistry(current, partial);

  await writeQualificationRegistry(merged);

  return merged;
};
