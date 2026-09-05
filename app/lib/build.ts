export type BuildMod = {
  id: string;
  title: string;
  author: string;
  description: string;
  icon_url: string | null;
  downloads: number;
  project_url: string;
};

const STORAGE_KEY = "modiumx-build";

export function getBuild(): BuildMod[] {
  if (typeof window === "undefined") {
    return [];
  }

  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function addToBuild(mod: BuildMod) {
  const build = getBuild();

  if (build.some((item) => item.id === mod.id)) {
    return build;
  }

  const updated = [...build, mod];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return updated;
}

export function removeFromBuild(id: string) {
  const build = getBuild();

  const updated = build.filter((mod) => mod.id !== id);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return updated;
}