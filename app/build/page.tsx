"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getBuild,
  removeFromBuild,
  type BuildMod,
} from "@/app/lib/build";

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

export default function BuildPage() {
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [build, setBuild] = useState<BuildMod[]>([]);

  useEffect(() => {
    setBuild(getBuild());
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
                {combinations.map((combination) => (
                    <div
                    key={`${combination.minecraft_version}-${combination.loader}`}
                    className={`rounded-2xl border p-5 ${
                        combination.compatible
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-zinc-800 bg-zinc-900/40"
                    }`}
                    >
                    <div className="flex items-center justify-between gap-4">
                        <div>
                        <div className="flex items-center gap-3">
                            <span
                            className={`h-2.5 w-2.5 rounded-full ${
                                combination.compatible
                                ? "bg-emerald-400"
                                : "bg-zinc-600"
                            }`}
                            />

                            <h3 className="font-semibold">
                            Minecraft {combination.minecraft_version}
                            </h3>

                            <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
                            {combination.loader}
                            </span>
                        </div>

                        <p className="mt-2 text-sm text-zinc-500">
                            {combination.compatible_count} /{" "}
                            {combination.total_count} модов совместимы
                        </p>
                        </div>

                        <span
                        className={`text-sm font-medium ${
                            combination.compatible
                            ? "text-emerald-400"
                            : "text-zinc-500"
                        }`}
                        >
                        {combination.compatible
                            ? "✓ Совместимо"
                            : "Не полностью совместимо"}
                        </span>
                    </div>

                    <div className="mt-5 grid gap-2">
                        {combination.mods.map((mod) => (
                        <div
                            key={mod.id}
                            className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2"
                        >
                            <span className="text-sm">
                            {mod.title}
                            </span>

                            {mod.compatible ? (
                            <span className="text-xs text-emerald-400">
                                ✓
                            </span>
                            ) : (
                            <span className="text-xs text-red-400">
                                ✕ {mod.reason}
                            </span>
                            )}
                        </div>
                        ))}
                    </div>
                    </div>
                ))}
                </div>
            </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}