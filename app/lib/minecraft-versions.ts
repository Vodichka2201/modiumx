export function parseMinecraftVersion(version: string): number[] {
  const match = version.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);

  if (!match) {
    return [];
  }

  return [
    Number(match[1]),
    Number(match[2]),
    Number(match[3] ?? 0),
  ];
}

export function compareMinecraftVersions(
  a: string,
  b: string
): number {
  const aParts = parseMinecraftVersion(a);
  const bParts = parseMinecraftVersion(b);

  for (let i = 0; i < 3; i++) {
    if ((aParts[i] ?? 0) > (bParts[i] ?? 0)) {
      return 1;
    }

    if ((aParts[i] ?? 0) < (bParts[i] ?? 0)) {
      return -1;
    }
  }

  return 0;
}

export function isVersionInRange(
  version: string,
  minVersion: string,
  maxVersion: string
): boolean {
  return (
    compareMinecraftVersions(version, minVersion) >= 0 &&
    compareMinecraftVersions(version, maxVersion) <= 0
  );
}