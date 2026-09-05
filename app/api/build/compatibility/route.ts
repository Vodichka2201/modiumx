import { NextRequest, NextResponse } from "next/server";

type BuildMod = {
  id: string;
  title: string;
};

type ModrinthDependency = {
  project_id: string | null;
  version_id: string | null;
  dependency_type:
    | "required"
    | "optional"
    | "incompatible"
    | "embedded";
};

type ModrinthVersion = {
  id: string;
  project_id: string;
  game_versions: string[];
  loaders: string[];
  dependencies: ModrinthDependency[];
  version_type: "release" | "beta" | "alpha";
};

type CompatibilityMod = {
  id: string;
  title: string;
  compatible: boolean;
  version_id: string | null;
  reason: string | null;
};

type Combination = {
  minecraft_version: string;
  loader: string;
  compatible: boolean;
  compatible_count: number;
  total_count: number;
  mods: CompatibilityMod[];
};

const API = "https://api.modrinth.com/v2";

const LOADERS = ["fabric", "forge", "neoforge"];

async function getVersions(projectId: string) {
  const response = await fetch(
    `${API}/project/${projectId}/version?include_changelog=false`,
    {
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch project ${projectId}`);
  }

  return (await response.json()) as ModrinthVersion[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const mods = body.mods as BuildMod[];

    if (!Array.isArray(mods) || mods.length === 0) {
      return NextResponse.json(
        { error: "No mods provided" },
        { status: 400 }
      );
    }

    const projectVersions = await Promise.all(
      mods.map(async (mod) => ({
        mod,
        versions: await getVersions(mod.id),
      }))
    );

    const minecraftVersions = new Set<string>();

    for (const item of projectVersions) {
      for (const version of item.versions) {
        if (version.version_type !== "release") {
          continue;
        }

        for (const gameVersion of version.game_versions) {
          minecraftVersions.add(gameVersion);
        }
      }
    }

    const combinations: Combination[] = [];

    for (const minecraftVersion of minecraftVersions) {
      for (const loader of LOADERS) {
        const resultMods: CompatibilityMod[] = [];

        for (const item of projectVersions) {
          const matchingVersion = item.versions.find(
            (version) =>
              version.version_type === "release" &&
              version.game_versions.includes(minecraftVersion) &&
              version.loaders.includes(loader)
          );

          if (!matchingVersion) {
            resultMods.push({
              id: item.mod.id,
              title: item.mod.title,
              compatible: false,
              version_id: null,
              reason: "Нет версии для этой Minecraft/loader комбинации",
            });

            continue;
          }

          const incompatibleWithBuild =
            matchingVersion.dependencies.some(
              (dependency) =>
                dependency.dependency_type === "incompatible" &&
                dependency.project_id &&
                mods.some((mod) => mod.id === dependency.project_id)
            );

          if (incompatibleWithBuild) {
            resultMods.push({
              id: item.mod.id,
              title: item.mod.title,
              compatible: false,
              version_id: matchingVersion.id,
              reason: "Несовместим с другим модом в сборке",
            });

            continue;
          }

          resultMods.push({
            id: item.mod.id,
            title: item.mod.title,
            compatible: true,
            version_id: matchingVersion.id,
            reason: null,
          });
        }

        const compatibleCount = resultMods.filter(
          (mod) => mod.compatible
        ).length;

        combinations.push({
          minecraft_version: minecraftVersion,
          loader,
          compatible: compatibleCount === mods.length,
          compatible_count: compatibleCount,
          total_count: mods.length,
          mods: resultMods,
        });
      }
    }

    combinations.sort((a, b) => {
      if (a.compatible !== b.compatible) {
        return a.compatible ? -1 : 1;
      }

      return b.compatible_count - a.compatible_count;
    });

    return NextResponse.json({
      combinations,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to analyze compatibility" },
      { status: 500 }
    );
  }
}