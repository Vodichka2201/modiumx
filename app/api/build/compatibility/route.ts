import { NextRequest, NextResponse } from "next/server";
import { isVersionInRange } from "@/app/lib/minecraft-versions";

type BuildMod = {
  id: string;
  title: string;
};

type ModrinthDependency = {
  project_id: string | null;
  version_id: string | null;
  file_name: string | null;
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

type CompatibilityDependency = {
  project_id: string | null;
  version_id: string | null;
  type: ModrinthDependency["dependency_type"];
  title: string | null;
  available: boolean;
};

type CompatibilityMod = {
  id: string;
  title: string;
  compatible: boolean;
  version_id: string | null;
  reason: string | null;
  status: "release" | "beta" | "missing";
  dependencies: CompatibilityDependency[];
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

const LOADERS = ["fabric", "neoforge", "forge"];
const DEFAULT_MIN_VERSION = "1.19";

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

async function getProject(projectId: string) {
  const response = await fetch(`${API}/project/${projectId}`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as {
    id: string;
    title: string;
  };
}

function getAvailableMinecraftVersions(
  projectVersions: {
    mod: BuildMod;
    versions: ModrinthVersion[];
  }[],
  minVersion: string,
  maxVersion?: string
) {
  const versions = new Set<string>();

  
  
  for (const item of projectVersions) {
    for (const version of item.versions) {
      if (
        version.version_type !== "release" &&
        version.version_type !== "beta"
      ) {
        continue;
      }

      for (const gameVersion of version.game_versions) {
        const insideRange = maxVersion
          ? isVersionInRange(
              gameVersion,
              minVersion,
              maxVersion
            )
          : true;

        if (insideRange) {
          versions.add(gameVersion);
        }
      }
    }
  }

  return [...versions];
}

function getAvailableLoaders(
  projectVersions: {
    mod: BuildMod;
    versions: ModrinthVersion[];
  }[]
) {
  const loaders = new Set<string>();

  for (const item of projectVersions) {
    for (const version of item.versions) {
      if (
        version.version_type !== "release" &&
        version.version_type !== "beta"
      ) {
        continue;
    }

      for (const loader of version.loaders) {
        if (LOADERS.includes(loader)) {
          loaders.add(loader);
        }
      }
    }
  }

  return [...loaders];
}

function hasCompatibleDependencyVersion(
  dependency: ModrinthDependency,
  projectVersions: Map<string, ModrinthVersion[]>,
  minecraftVersion: string,
  loader: string
) {
  if (!dependency.project_id) {
    return false;
  }

  const dependencyVersions = projectVersions.get(
    dependency.project_id
  );

  if (!dependencyVersions) {
    return false;
  }

  return dependencyVersions.some(
    (version) =>
      version.version_type === "release" &&
      version.game_versions.includes(minecraftVersion) &&
      version.loaders.includes(loader)
  );
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

    const minVersion =
      typeof body.min_version === "string"
        ? body.min_version
        : DEFAULT_MIN_VERSION;

    const maxVersion =
      typeof body.max_version === "string"
        ? body.max_version
        : undefined;

    const projectVersions = await Promise.all(
      mods.map(async (mod) => ({
        mod,
        versions: await getVersions(mod.id),
      }))
    );

    const projects = new Map<
      string,
      {
        id: string;
        title: string;
      }
    >();

    await Promise.all(
      projectVersions.map(async (item) => {
        const project = await getProject(item.mod.id);

        if (project) {
          projects.set(project.id, project);
        }
      })
    );

    /*
     * Все версии проектов, которые есть в сборке.
     * Нужны для проверки dependencies.
     */
    const versionsByProject = new Map<
      string,
      ModrinthVersion[]
    >();

    for (const item of projectVersions) {
      versionsByProject.set(item.mod.id, item.versions);
    }

    const minecraftVersions = getAvailableMinecraftVersions(
      projectVersions,
      minVersion,
      maxVersion
    );

    const availableLoaders = getAvailableLoaders(
      projectVersions
    );

    const combinations: Combination[] = [];

    for (const minecraftVersion of minecraftVersions) {
      for (const loader of availableLoaders) {
        const resultMods: CompatibilityMod[] = [];

        for (const item of projectVersions) {
            const releaseVersion = item.versions.find(
            (version) =>
                version.version_type === "release" &&
                version.game_versions.includes(minecraftVersion) &&
                version.loaders.includes(loader)
            );

            const betaVersion = item.versions.find(
            (version) =>
                version.version_type === "beta" &&
                version.game_versions.includes(minecraftVersion) &&
                version.loaders.includes(loader)
            );

            const matchingVersion = releaseVersion ?? betaVersion;

          /*
           * У этого мода вообще нет версии под
           * конкретные Minecraft + loader.
           */
          if (!matchingVersion) {
            resultMods.push({
                id: item.mod.id,
                title: item.mod.title,
                compatible: false,
                version_id: null,
                reason:
                "Нет версии для этой Minecraft/loader комбинации",
                status: "missing",
                dependencies: [],
            });


            continue;
            }

            const status: "release" | "beta" =
                matchingVersion.version_type === "release"
                    ? "release"
                    : "beta";


          const dependencies: CompatibilityDependency[] =
            matchingVersion.dependencies.map((dependency) => {
              const dependencyProject =
                dependency.project_id
                  ? projects.get(dependency.project_id)
                  : null;

              /*
               * Если dependency есть в сборке,
               * проверяем не только её наличие,
               * но и наличие подходящей версии.
               */
              const dependencyAvailable =
                dependency.project_id
                  ? hasCompatibleDependencyVersion(
                      dependency,
                      versionsByProject,
                      minecraftVersion,
                      loader
                    )
                  : false;

              return {
                project_id: dependency.project_id,
                version_id: dependency.version_id,
                type: dependency.dependency_type,
                title: dependencyProject?.title ?? null,
                available:
                  dependency.dependency_type === "optional" ||
                  dependency.dependency_type === "embedded" ||
                  dependencyAvailable,
              };
            });

          /*
           * Required dependency отсутствует
           * или присутствует, но не имеет подходящей версии.
           */
          const missingRequiredDependency =
            dependencies.find(
              (dependency) =>
                dependency.type === "required" &&
                !dependency.available
            );

          if (missingRequiredDependency) {
                resultMods.push({
                id: item.mod.id,
                title: item.mod.title,
                compatible: status === "release",
                version_id: matchingVersion.id,
                reason:
                    status === "beta"
                    ? "Есть только beta-версия"
                    : null,
                status,
                dependencies,
                });

            continue;
          }

          /*
           * Проверяем incompatible dependencies.
           */
          const incompatibleDependency =
            dependencies.find(
              (dependency) =>
                dependency.type === "incompatible" &&
                dependency.project_id &&
                mods.some(
                  (mod) =>
                    mod.id === dependency.project_id
                )
            );

          if (incompatibleDependency) {
            resultMods.push({
              id: item.mod.id,
              title: item.mod.title,
              compatible: false,
              version_id: matchingVersion.id,
              reason: incompatibleDependency.title
                ? `Несовместим с ${incompatibleDependency.title}`
                : "Несовместим с другим модом в сборке",
                status,
              dependencies,
            });

            continue;
          }

          resultMods.push({
            id: item.mod.id,
            title: item.mod.title,
            compatible: true,
            version_id: matchingVersion.id,
            reason: null,
            status,
            dependencies,
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

    /*
     * Сначала полностью совместимые.
     * Затем частично совместимые.
     * Внутри группы — новые Minecraft версии первыми.
     */
    combinations.sort((a, b) => {
      if (a.compatible !== b.compatible) {
        return a.compatible ? -1 : 1;
      }

      if (a.compatible_count !== b.compatible_count) {
        return b.compatible_count - a.compatible_count;
      }

      return b.minecraft_version.localeCompare(
        a.minecraft_version,
        undefined,
        {
          numeric: true,
        }
      );
    });

    return NextResponse.json({
      combinations,
    });
  } catch (error) {
    console.error(
      "Compatibility analysis error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to analyze compatibility",
      },
      { status: 500 }
    );
  }
}