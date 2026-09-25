"use client";

import { FormEvent, useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");

  function handleSearch(event: FormEvent) {
    event.preventDefault();

    if (!query.trim()) {
      window.location.href = "/mods";
      return;
    }

    window.location.href = `/mods?q=${encodeURIComponent(query.trim())}`;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="/" className="text-xl font-bold tracking-tight">
            Modium<span className="text-violet-400">X</span>
          </a>

          <nav className="flex items-center gap-8 text-sm text-zinc-400">
            <a
              href="/mods"
              className="transition hover:text-white"
            >
              Моды
            </a>

            <a
              href="/build"
              className="transition hover:text-white"
            >
              Моя сборка
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-300">
            Minecraft mod compatibility
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Проверь совместимость
            <span className="block text-violet-400">
              своей сборки
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            Добавь нужные моды и узнай, какие версии Minecraft и
            загрузчики подходят для всей сборки.
          </p>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row"
          >
            <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-white/5 px-4 shadow-2xl shadow-black/20">
              <span className="mr-3 text-zinc-500">⌕</span>

              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Найти мод..."
                className="w-full bg-transparent py-4 text-white outline-none placeholder:text-zinc-600"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-violet-500 px-7 py-4 font-medium transition hover:bg-violet-400"
            >
              Найти моды
            </button>
          </form>

          <div className="mt-5">
            <a
              href="/build"
              className="text-sm text-zinc-500 transition hover:text-white"
            >
              Или сразу открыть мою сборку →
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-violet-400">
              HOW IT WORKS
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              От модов до рабочей конфигурации
            </h2>

            <p className="mt-4 leading-7 text-zinc-400">
              ModiumX не устанавливает сборки и не скачивает моды.
              Он проверяет их совместимость и показывает подходящие
              комбинации.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Добавь моды",
                description:
                  "Найди нужные моды и добавь их в свою сборку.",
              },
              {
                number: "02",
                title: "Запусти проверку",
                description:
                  "ModiumX сопоставит версии Minecraft, loaders и доступные версии модов.",
              },
              {
                number: "03",
                title: "Найди рабочий вариант",
                description:
                  "Получи совместимые конфигурации и узнай, где возникают проблемы.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-white/10 bg-zinc-900 p-6"
              >
                <span className="text-sm font-medium text-violet-400">
                  {step.number}
                </span>

                <h3 className="mt-5 text-lg font-semibold">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compatibility Preview */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-medium text-violet-400">
              COMPATIBILITY
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Найди точку совместимости
            </h2>

            <p className="mt-4 max-w-xl leading-7 text-zinc-400">
              Одна и та же сборка может работать на нескольких
              версиях Minecraft и loaders. ModiumX показывает эти
              варианты и помогает выбрать подходящий.
            </p>

            <a
              href="/build"
              className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Проверить сборку
            </a>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-sm text-zinc-500">
                  Совместимая конфигурация
                </p>

                <h3 className="mt-1 text-xl font-semibold">
                  Minecraft 1.21.1
                </h3>
              </div>

              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                Совместимо
              </span>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-zinc-400">
                Loader
              </span>

              <span className="font-medium">
                Fabric
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {["Sodium", "Iris", "Lithium", "Mod Menu"].map(
                (mod) => (
                  <div
                    key={mod}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                  >
                    <span className="text-sm text-zinc-300">
                      {mod}
                    </span>

                    <span className="text-sm font-semibold text-emerald-400">
                      ✓
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">
                  Совместимость
                </span>

                <span className="font-medium text-emerald-400">
                  4 / 4 модов
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold">
            Готов проверить свою сборку?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-zinc-500">
            Добавь моды и найди версии Minecraft и loader,
            которые подходят именно твоей сборке.
          </p>

          <a
            href="/build"
            className="mt-8 inline-flex rounded-xl bg-violet-500 px-7 py-3.5 font-medium transition hover:bg-violet-400"
          >
            Открыть мою сборку
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Modium<span className="text-violet-400">X</span>
          </span>

          <span>
            Проверка совместимости Minecraft-модов
          </span>
        </div>
      </footer>
    </main>
  );
}