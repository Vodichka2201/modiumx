"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getBuild,
  removeFromBuild,
  type BuildMod,
} from "@/app/lib/build";


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
  status?: "release" | "beta" | "missing";
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

type MinecraftVersionResponse = {
  versions: string[];
};

type LoaderResult = Combination;

type VersionGroup = {
  minecraft_version: string;
  loaders: LoaderResult[];
};

export default function BuildPage() {
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [build, setBuild] = useState<BuildMod[]>([]);
  const [minecraftVersions, setMinecraftVersions] = useState<string[]>([]);
  const [minVersion, setMinVersion] = useState("1.19");
  const [maxVersion, setMaxVersion] = useState("26");

  useEffect(() => {
    setBuild(getBuild());
  }, []);

  useEffect(() => {
    async function loadVersions() {
        try {
        const response = await fetch(
            "/api/minecraft/versions"
        );

        if (!response.ok) {
            return;
        }

        const data: MinecraftVersionResponse =
            await response.json();

        setMinecraftVersions(data.versions);
        } catch {
        console.error(
            "Failed to load Minecraft versions"
        );
        }
    }

    loadVersions();
  }, []);

  async function analyzeBuild() {
    if (build.length === 0) {
        return;
    }

    setAnalyzing(true);
    setAnalysisError("");

    try {
        const response = await fetch("/api/build/compatibility", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mods: build.map((mod) => ({
            id: mod.id,
            title: mod.title,
          })),
          min_version: minVersion,
          max_version: maxVersion,
        }),
        });

        if (!response.ok) {
        throw new Error("Analysis failed");
        }

        const data = await response.json();

        setCombinations(data.combinations);
    } catch {
        setAnalysisError(
        "Не удалось проанализировать сборку. Попробуй ещё раз."
        );
    } finally {
        setAnalyzing(false);
    }
    }

  function removeMod(id: string) {
    setBuild(removeFromBuild(id));
  }

  const groupedCombinations = combinations.reduce<VersionGroup[]>(
  (groups, combination) => {
    const existing = groups.find(
      (group) =>
        group.minecraft_version === combination.minecraft_version
    );

    if (existing) {
      existing.loaders.push(combination);
    } else {
      groups.push({
        minecraft_version: combination.minecraft_version,
        loaders: [combination],
      });
    }

    return groups;
  },
  []
);

    const sortedVersionGroups = [...groupedCombinations].sort(
    (a, b) => {
        const aBest = Math.max(
        ...a.loaders.map((loader) => loader.compatible_count)
        );

        const bBest = Math.max(
        ...b.loaders.map((loader) => loader.compatible_count)
        );

        const aPerfect = a.loaders.some(
        (loader) => loader.compatible
        );

        const bPerfect = b.loaders.some(
        (loader) => loader.compatible
        );

        // Сначала версии, где есть полностью совместимый loader.
        if (aPerfect !== bPerfect) {
        return aPerfect ? -1 : 1;
        }

        // Затем версии с большим количеством совместимых модов.
        if (aBest !== bBest) {
        return bBest - aBest;
        }

        // Затем новые Minecraft версии.
        return b.minecraft_version.localeCompare(
        a.minecraft_version,
        undefined,
        { numeric: true }
        );
    }
    );

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold">
            ModiumX
          </Link>

          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/mods" className="hover:text-white">
              Моды
            </Link>

            <Link href="/build" className="text-white">
              Моя сборка
            </Link>

            <Link href="/" className="hover:text-white">
              Сборки
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <p className="mb-2 text-sm text-zinc-500">MODIUMX / BUILD</p>

          <h1 className="text-4xl font-bold tracking-tight">
            Моя сборка
          </h1>

          <p className="mt-3 text-zinc-400">
            {build.length === 0
              ? "Добавь моды, чтобы начать собирать сборку."
              : `${build.length} ${build.length === 1 ? "мод" : "модов"} в сборке`}
          </p>
        </div>

        {build.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
            <div className="text-4xl">🧩</div>

            <h2 className="mt-4 text-xl font-semibold">
              Сборка пока пустая
            </h2>

            <p className="mt-2 text-zinc-500">
              Найди нужные моды и добавь их сюда.
            </p>

            <Link
              href="/mods"
              className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-medium text-black hover:bg-zinc-200"
            >
              Найти моды
            </Link>
          </div>
        ) : (
            <>

            <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="mb-4">
                    <h2 className="font-semibold">
                    Версии Minecraft
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                    Ограничь диапазон версий для анализа.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                    <span className="mb-2 block text-sm text-zinc-400">
                        От
                    </span>

                    <select
                        value={minVersion}
                        onChange={(event) =>
                        setMinVersion(event.target.value)
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-zinc-500"
                    >
                        {minecraftVersions.map((version) => (
                        <option key={version} value={version}>
                            {version}
                        </option>
                        ))}
                    </select>
                    </label>

                    <label className="block">
                    <span className="mb-2 block text-sm text-zinc-400">
                        До
                    </span>

                    <select
                        value={maxVersion}
                        onChange={(event) =>
                        setMaxVersion(event.target.value)
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-zinc-500"
                    >
                        {minecraftVersions.map((version) => (
                        <option key={version} value={version}>
                            {version}
                        </option>
                        ))}
                    </select>
                    </label>
                </div>
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-4">
                <button
                    onClick={analyzeBuild}
                    disabled={analyzing}
                    className="rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {analyzing ? "Анализируем..." : "Проверить совместимость"}
                </button>

                {analysisError && (
                    <p className="text-sm text-red-400">
                    {analysisError}
                    </p>
                )}
            </div>
          <div className="grid gap-4">
            {build.map((mod) => (
              <article
                key={mod.id}
                className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                  {mod.icon_url ? (
                    <img
                      src={mod.icon_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl">
                      🧩
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{mod.title}</h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    {mod.author}
                  </p>

                  <p className="mt-2 line-clamp-1 text-sm text-zinc-400">
                    {mod.description}
                  </p>
                </div>

                <button
                  onClick={() => removeMod(mod.id)}
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition hover:border-red-900 hover:text-red-400"
                >
                  Удалить
                </button>
              </article>
            ))}
          </div>

          {combinations.length > 0 && (
            <section className="mt-12">
                <div className="mb-6">
                <p className="text-sm text-zinc-500">
                    MODIUMX / COMPATIBILITY
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                    Совместимые комбинации
                </h2>

                <p className="mt-2 text-zinc-400">
                    ModiumX проверил версии модов и доступные загрузчики.
                </p>
                </div>

                <div className="grid gap-3">
                    <div className="space-y-4">
                    {sortedVersionGroups.map((group) => {
                        const hasPerfectLoader = group.loaders.some(
                        (loader) => loader.compatible
                        );
                        const hasBetaLoader = group.loaders.some(
                        (loader) =>
                            !loader.compatible &&
                            loader.mods.some(
                            (mod) => mod.status === "beta"
                            ) &&
                            !loader.mods.some(
                            (mod) => mod.status === "missing"
                            )
                        );

                        return (
                        <div
                            key={group.minecraft_version}
                            className={`rounded-2xl border p-5 ${
                            hasPerfectLoader
                                ? "border-emerald-500/30 bg-emerald-500/5"
                                : "border-zinc-800 bg-zinc-900/50"
                            }`}
                        >
                            <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">
                                Minecraft {group.minecraft_version}
                                </h3>

                                <p className="mt-1 text-sm text-zinc-500">
                                {hasPerfectLoader
                                    ? "Есть полностью совместимый loader"
                                    : hasBetaLoader
                                    ? "Есть loader с beta-версиями"
                                    : "Полностью совместимой конфигурации нет"}
                                </p>
                            </div>

                            {hasPerfectLoader ? (
                                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                                Совместимо
                                </span>
                            ) : (
                                <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                                Есть проблемы
                                </span>
                            )}
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                            {group.loaders
                                .sort((a, b) => {
                                if (a.compatible !== b.compatible) {
                                    return a.compatible ? -1 : 1;
                                }

                                return (
                                    b.compatible_count - a.compatible_count
                                );
                                })
                                .map((combination) => {
                                const percentage =
                                    combination.total_count === 0
                                    ? 0
                                    : Math.round(
                                        (combination.compatible_count /
                                            combination.total_count) *
                                            100
                                        );

                                return (
                                    <div
                                    key={combination.loader}
                                    className={`rounded-xl border p-4 ${
                                        combination.compatible
                                        ? "border-emerald-500/30 bg-emerald-500/5"
                                        : combination.mods.some(
                                            (mod) => mod.status === "beta"
                                        ) &&
                                        !combination.mods.some(
                                            (mod) => mod.status === "missing"
                                        )
                                        ? "border-yellow-500/30 bg-yellow-500/5"
                                        : combination.compatible_count > 0
                                            ? "border-yellow-500/30 bg-yellow-500/5"
                                            : "border-red-500/20 bg-red-500/5"
                                    }`}
                                    >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium capitalize">
                                        {combination.loader}
                                        </span>

                                        <span
                                        className={`text-sm font-semibold ${
                                            combination.compatible
                                            ? "text-emerald-400"
                                            : combination.compatible_count > 0
                                                ? "text-yellow-400"
                                                : "text-red-400"
                                        }`}
                                        >
                                        {combination.compatible_count}/
                                        {combination.total_count}
                                        </span>
                                    </div>

                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                                        <div
                                        className={`h-full rounded-full ${
                                            combination.compatible
                                            ? "bg-emerald-500"
                                            : combination.compatible_count > 0
                                                ? "bg-yellow-500"
                                                : "bg-red-500"
                                        }`}
                                        style={{
                                            width: `${percentage}%`,
                                        }}
                                        />
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {combination.mods.map((mod) => {
                                        const statusConfig = {
                                            release: {
                                                icon: "✓",
                                                className: "text-emerald-400",
                                            },
                                            beta: {
                                                icon: "β",
                                                className: "text-yellow-400",
                                            },
                                            missing: {
                                                icon: "✕",
                                                className: "text-red-400",
                                            },
                                            }[mod.status ?? (mod.compatible ? "release" : "missing")];

                                        return (
                                            <div
                                            key={mod.id}
                                            className="flex items-start gap-2 text-sm"
                                            >
                                            <span
                                                className={`mt-0.5 w-4 shrink-0 text-center font-semibold ${statusConfig.className}`}
                                                title={
                                                mod.status === "release"
                                                    ? "Есть стабильная версия"
                                                    : mod.status === "beta"
                                                    ? "Есть только beta-версия"
                                                    : "Нет подходящей версии"
                                                }
                                            >
                                                {statusConfig.icon}
                                            </span>

                                            <div className="min-w-0">
                                                <div className="truncate text-zinc-200">
                                                {mod.title}
                                                </div>

                                                {mod.status === "beta" && (
                                                <div className="mt-0.5 text-xs text-yellow-400/80">
                                                    Только beta-версия
                                                </div>
                                                )}

                                                {mod.status === "missing" &&
                                                mod.reason && (
                                                    <div className="mt-0.5 text-xs text-red-400/80">
                                                    {mod.reason}
                                                    </div>
                                                )}
                                            </div>
                                            </div>
                                        );
                                        })}
                                    </div>
                                    </div>
                                );
                                })}
                            </div>
                        </div>
                        );
                    })}
                    </div>
                </div>
            </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}