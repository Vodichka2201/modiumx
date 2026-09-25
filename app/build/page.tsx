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

function compareMinecraftVersions(a: string, b: string) {
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const aPart = aParts[i] ?? 0;
    const bPart = bParts[i] ?? 0;

    if (aPart !== bPart) {
      return aPart - bPart;
    }
  }

  return 0;
}

function getCombinationScore(combination: Combination) {
  const releaseCount = combination.mods.filter(
    (mod) => mod.status === "release"
  ).length;

  const betaCount = combination.mods.filter(
    (mod) => mod.status === "beta"
  ).length;

  const missingCount = combination.mods.filter(
    (mod) => mod.status === "missing"
  ).length;

  return {
    perfect: combination.compatible ? 1 : 0,
    releaseCount,
    missingCount,
    betaCount,
    version: combination.minecraft_version,
  };
}

function compareCombinations(a: Combination, b: Combination) {
  const aScore = getCombinationScore(a);
  const bScore = getCombinationScore(b);

  if (aScore.perfect !== bScore.perfect) {
    return bScore.perfect - aScore.perfect;
  }

  if (aScore.releaseCount !== bScore.releaseCount) {
    return bScore.releaseCount - aScore.releaseCount;
  }

  if (aScore.missingCount !== bScore.missingCount) {
    return aScore.missingCount - bScore.missingCount;
  }

  if (aScore.betaCount !== bScore.betaCount) {
    return aScore.betaCount - bScore.betaCount;
  }

  return compareMinecraftVersions(
    bScore.version,
    aScore.version
  );
}

export default function BuildPage() {
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [build, setBuild] = useState<BuildMod[]>([]);
  const [minecraftVersions, setMinecraftVersions] = useState<string[]>([]);

  const [minVersion, setMinVersion] = useState("");
  const [maxVersion, setMaxVersion] = useState("");

  useEffect(() => {
    setBuild(getBuild());
  }, []);

  useEffect(() => {
    async function loadVersions() {
      try {
        const response = await fetch("/api/minecraft/versions");

        if (!response.ok) {
          return;
        }

        const data: MinecraftVersionResponse = await response.json();

        const sortedVersions = [...data.versions].sort(
          (a, b) => compareMinecraftVersions(b, a)
        );

        setMinecraftVersions(sortedVersions);

        /*
         * Автоматически выставляем реальные значения,
         * которые существуют в списке Modrinth.
         */
        const preferredMin = sortedVersions.find(
          (version) =>
            compareMinecraftVersions(version, "1.19") >= 0
        );

        setMinVersion(
          preferredMin
            ? sortedVersions
                .filter(
                  (version) =>
                    compareMinecraftVersions(version, "1.19") >= 0
                )
                .at(-1) ?? sortedVersions.at(-1) ?? ""
            : sortedVersions.at(-1) ?? ""
        );

        setMaxVersion(sortedVersions[0] ?? "");
      } catch {
        console.error("Failed to load Minecraft versions");
      }
    }

    loadVersions();
  }, []);

  async function analyzeBuild() {
    if (build.length === 0) {
      return;
    }

    if (!minVersion || !maxVersion) {
      setAnalysisError(
        "Подожди, пока загрузятся версии Minecraft."
      );
      return;
    }

    if (
      compareMinecraftVersions(minVersion, maxVersion) > 0
    ) {
      setAnalysisError(
        "Начальная версия не может быть новее конечной."
      );
      return;
    }

    setAnalyzing(true);
    setAnalysisError("");
    setCombinations([]);

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
    setCombinations([]);
    setAnalysisError("");
  }

  const groupedCombinations = combinations.reduce<VersionGroup[]>(
    (groups, combination) => {
      const existing = groups.find(
        (group) =>
          group.minecraft_version ===
          combination.minecraft_version
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
      const bestA = [...a.loaders].sort(
        compareCombinations
      )[0];

      const bestB = [...b.loaders].sort(
        compareCombinations
      )[0];

      return compareCombinations(bestA, bestB);
    }
  );

  const bestCombination =
    [...combinations].sort(compareCombinations)[0] ?? null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            Modium<span className="text-violet-400">X</span>
          </Link>

          <nav className="flex items-center gap-8 text-sm text-zinc-400">
            <Link
              href="/mods"
              className="transition hover:text-white"
            >
              Моды
            </Link>

            <Link
              href="/build"
              className="text-white"
            >
              Моя сборка
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-violet-400">
              MY BUILD
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Моя сборка
            </h1>

            <p className="mt-3 text-zinc-400">
              {build.length === 0
                ? "Добавь моды, чтобы начать проверку совместимости."
                : `${build.length} ${
                    build.length === 1 ? "мод" : "модов"
                  } в сборке`}
            </p>
          </div>

          <Link
            href="/mods"
            className="inline-flex w-fit items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
          >
            + Добавить моды
          </Link>
        </div>

        {build.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <div className="text-5xl">🧩</div>

            <h2 className="mt-5 text-xl font-semibold">
              Сборка пока пустая
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Найди нужные моды и добавь их сюда. После этого
              ModiumX сможет проверить их совместимость.
            </p>

            <Link
              href="/mods"
              className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200"
            >
              Найти моды
            </Link>
          </div>
        ) : (
          <>
            <section className="mt-10">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  Моды в сборке
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Эти моды будут проверены вместе.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {build.map((mod) => (
                  <article
                    key={mod.id}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 transition hover:border-white/20"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
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
                      <h3 className="truncate font-semibold">
                        {mod.title}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-500">
                        {mod.author}
                      </p>
                    </div>

                    <button
                      onClick={() => removeMod(mod.id)}
                      className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-500 transition hover:border-red-500/30 hover:text-red-400"
                    >
                      Удалить
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
              <div>
                <h2 className="font-semibold">
                  Диапазон Minecraft
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  ModiumX будет искать совместимость только
                  внутри этого диапазона.
                </p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm text-zinc-400">
                    От
                  </span>

                  <select
                    value={minVersion}
                    disabled={minecraftVersions.length === 0}
                    onChange={(event) => {
                      setMinVersion(event.target.value);
                      setCombinations([]);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400/50 disabled:cursor-wait disabled:opacity-50"
                  >
                    {minecraftVersions.map((version) => (
                      <option
                        key={version}
                        value={version}
                      >
                        {version}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm text-zinc-400">
                    До
                  </span>

                  <select
                    value={maxVersion}
                    disabled={minecraftVersions.length === 0}
                    onChange={(event) => {
                      setMaxVersion(event.target.value);
                      setCombinations([]);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400/50 disabled:cursor-wait disabled:opacity-50"
                  >
                    {minecraftVersions.map((version) => (
                      <option
                        key={version}
                        value={version}
                      >
                        {version}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={analyzeBuild}
                  disabled={
                    analyzing ||
                    minecraftVersions.length === 0 ||
                    !minVersion ||
                    !maxVersion
                  }
                  className="rounded-xl bg-violet-500 px-6 py-3 font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {analyzing
                    ? "Ищем конфигурацию..."
                    : "Найти лучшую конфигурацию"}
                </button>

                {analysisError && (
                  <p className="text-sm text-red-400">
                    {analysisError}
                  </p>
                )}
              </div>
            </section>

            {combinations.length > 0 && (
              <section className="mt-12">
                <div className="mb-6">
                  <p className="text-sm font-medium text-violet-400">
                    COMPATIBILITY
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Результат проверки
                  </h2>

                  <p className="mt-2 text-zinc-400">
                    ModiumX проверил выбранные моды на доступных
                    версиях Minecraft и загрузчиках.
                  </p>
                </div>

                {bestCombination && (
                  <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                      <div>
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                          Лучшая найденная конфигурация
                        </span>

                        <h3 className="mt-3 text-2xl font-bold">
                          Minecraft{" "}
                          {bestCombination.minecraft_version}
                        </h3>

                        <p className="mt-1 text-zinc-400">
                          Loader:{" "}
                          <span className="font-medium capitalize text-white">
                            {bestCombination.loader}
                          </span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <div
                          className={`text-3xl font-bold ${
                            bestCombination.compatible
                              ? "text-emerald-400"
                              : "text-yellow-400"
                          }`}
                        >
                          {bestCombination.compatible_count}/
                          {bestCombination.total_count}
                        </div>

                        <div className="text-sm text-zinc-500">
                          модов совместимы
                        </div>
                      </div>
                    </div>

                    {!bestCombination.compatible && (
                      <p className="mt-5 border-t border-white/10 pt-4 text-sm text-yellow-400/80">
                        Полностью совместной конфигурации в
                        выбранном диапазоне не найдено. Это
                        лучший доступный вариант.
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {sortedVersionGroups.map((group) => {
                    const hasPerfectLoader =
                      group.loaders.some(
                        (loader) => loader.compatible
                      );

                    const hasBetaLoader =
                      group.loaders.some(
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
                            : "border-white/10 bg-zinc-900/50"
                        }`}
                      >
                        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                          <div>
                            <h3 className="text-lg font-semibold">
                              Minecraft{" "}
                              {group.minecraft_version}
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
                            <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                              Совместимо
                            </span>
                          ) : (
                            <span className="w-fit rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                              Есть проблемы
                            </span>
                          )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          {[...group.loaders]
                            .sort(compareCombinations)
                            .map((combination) => {
                              const percentage =
                                combination.total_count === 0
                                  ? 0
                                  : Math.round(
                                      (combination.compatible_count /
                                        combination.total_count) *
                                        100
                                    );

                              const hasOnlyBeta =
                                combination.mods.some(
                                  (mod) =>
                                    mod.status === "beta"
                                ) &&
                                !combination.mods.some(
                                  (mod) =>
                                    mod.status === "missing"
                                );

                              return (
                                <div
                                  key={combination.loader}
                                  className={`rounded-xl border p-4 ${
                                    combination.compatible
                                      ? "border-emerald-500/30 bg-emerald-500/5"
                                      : hasOnlyBeta
                                      ? "border-yellow-500/30 bg-yellow-500/5"
                                      : combination.compatible_count >
                                        0
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
                                          : combination.compatible_count >
                                            0
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
                                          : combination.compatible_count >
                                            0
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                      }`}
                                      style={{
                                        width: `${percentage}%`,
                                      }}
                                    />
                                  </div>

                                  <div className="mt-4 space-y-2">
                                    {combination.mods.map(
                                      (mod) => {
                                        const statusConfig = {
                                          release: {
                                            icon: "✓",
                                            className:
                                              "text-emerald-400",
                                          },
                                          beta: {
                                            icon: "β",
                                            className:
                                              "text-yellow-400",
                                          },
                                          missing: {
                                            icon: "✕",
                                            className:
                                              "text-red-400",
                                          },
                                        }[
                                          mod.status ??
                                            (mod.compatible
                                              ? "release"
                                              : "missing")
                                        ];

                                        return (
                                          <div
                                            key={mod.id}
                                            className="flex items-start gap-2 text-sm"
                                          >
                                            <span
                                              className={`mt-0.5 w-4 shrink-0 text-center font-semibold ${statusConfig.className}`}
                                            >
                                              {statusConfig.icon}
                                            </span>

                                            <div className="min-w-0">
                                              <div className="truncate text-zinc-200">
                                                {mod.title}
                                              </div>

                                              {mod.status ===
                                                "beta" && (
                                                <div className="mt-0.5 text-xs text-yellow-400/80">
                                                  Только beta-версия
                                                </div>
                                              )}

                                              {mod.status ===
                                                "missing" &&
                                                mod.reason && (
                                                  <div className="mt-0.5 text-xs text-red-400/80">
                                                    {mod.reason}
                                                  </div>
                                                )}
                                            </div>
                                          </div>
                                        );
                                      }
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
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}