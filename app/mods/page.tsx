"use client";

import { FormEvent, useState } from "react";

type Mod = {
  project_id: string;
  title: string;
  description: string;
  icon_url?: string;
  downloads: number;
  author: string;
};

type SearchResponse = {
  hits: Mod[];
};

export default function ModsPage() {
  const [query, setQuery] = useState("");
  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchMods(event: FormEvent) {
    event.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/mods?q=${encodeURIComponent(query.trim())}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: SearchResponse = await response.json();
      setMods(data.hits);
    } catch {
      setError("Не удалось получить моды. Попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="/" className="text-xl font-bold tracking-tight">
            Modium<span className="text-violet-400">X</span>
          </a>

          <nav className="flex items-center gap-8 text-sm text-zinc-400">
            <a href="/mods" className="text-white">
              Моды
            </a>
            <a href="#" className="transition hover:text-white">
              Моя сборка
            </a>
            <a href="#" className="transition hover:text-white">
              Сборки
            </a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-violet-400">
            MOD SEARCH
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Найди свой мод
          </h1>

          <p className="mt-4 text-zinc-400">
            Поиск по Modrinth. Версии и совместимость разберём следующим
            этапом.
          </p>

          <form onSubmit={searchMods} className="mt-8 flex gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Например: Sodium, Create, Iris..."
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-zinc-600 focus:border-violet-400/50"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-500 px-7 font-medium transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Ищем..." : "Найти"}
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {mods.length > 0 && (
          <section className="mt-14">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  Результаты
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Найдено проектов: {mods.length}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mods.map((mod) => (
                <article
                  key={mod.project_id}
                  className="group rounded-2xl border border-white/10 bg-zinc-900 p-5 transition hover:-translate-y-1 hover:border-white/20"
                >
                  <div className="flex gap-4">
                    {mod.icon_url ? (
                      <img
                        src={mod.icon_url}
                        alt=""
                        className="h-14 w-14 rounded-xl"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-violet-500/20" />
                    )}

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">
                        {mod.title}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-600">
                        {mod.author}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-zinc-400">
                    {mod.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs text-zinc-600">
                      {mod.downloads.toLocaleString("ru-RU")} загрузок
                    </span>

                    <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-violet-500 hover:text-white">
                      + Добавить
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {!loading && mods.length === 0 && !error && (
          <div className="mt-20 text-center text-zinc-600">
            <p className="text-5xl">⌕</p>
            <p className="mt-4">
              Введи название мода, чтобы начать поиск
            </p>
          </div>
        )}
      </section>
    </main>
  );
}