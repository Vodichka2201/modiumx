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

          <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="/mods" className="transition hover:text-white">
              Моды
            </a>
            <a href="/build" className="transition hover:text-white">
              Моя сборка
            </a>
            <a href="#" className="transition hover:text-white">
              Сборки
            </a>
          </nav>

          <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10">
            Войти
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-300">
            Minecraft modpack builder
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Собери свой Minecraft
            <span className="block text-violet-400">без боли с совместимостью</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            Найди нужные моды, добавь их в сборку и узнай, на каких версиях
            Minecraft и загрузчиках они смогут работать вместе.
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
        </div>
      </section>

      {/* Selected mods */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-violet-400">
                YOUR BUILD
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Твоя сборка
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Здесь появятся моды, которые ты добавишь.
              </p>
            </div>

            <button className="text-sm text-zinc-400 transition hover:text-white">
              Открыть сборку →
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "Sodium",
                description: "Оптимизация графики",
                color: "bg-blue-500",
              },
              {
                name: "Iris Shaders",
                description: "Шейдеры",
                color: "bg-purple-500",
              },
              {
                name: "Lithium",
                description: "Оптимизация сервера",
                color: "bg-green-500",
              },
              {
                name: "Mod Menu",
                description: "Управление модами",
                color: "bg-orange-500",
              },
            ].map((mod) => (
              <div
                key={mod.name}
                className="group rounded-2xl border border-white/10 bg-zinc-900 p-5 transition hover:-translate-y-1 hover:border-white/20"
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${mod.color} text-lg font-bold`}
                >
                  {mod.name.charAt(0)}
                </div>

                <h3 className="font-semibold">{mod.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {mod.description}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-zinc-600">
                    Fabric · 1.21.1
                  </span>

                  <button className="text-sm text-zinc-500 transition hover:text-red-400">
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compatibility */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-violet-400">
            COMPATIBILITY
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Найди точку совместимости
          </h2>

          <p className="mt-4 leading-7 text-zinc-400">
            ModiumX сопоставит выбранные моды и покажет комбинации Minecraft
            и загрузчиков, в которых твоя сборка сможет работать.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-3 border-b border-white/10 bg-white/5 px-6 py-4 text-sm font-medium text-zinc-400">
            <span>Версия Minecraft</span>
            <span>Loader</span>
            <span>Совместимость</span>
          </div>

          {[
            ["1.21.1", "Fabric", "Все моды совместимы"],
            ["1.21.4", "Fabric", "Все моды совместимы"],
            ["1.21.5", "Fabric", "Не хватает Lithium"],
          ].map(([version, loader, result]) => (
            <div
              key={version}
              className="grid grid-cols-3 items-center border-b border-white/5 px-6 py-5 text-sm last:border-0"
            >
              <span className="font-medium">{version}</span>
              <span className="text-zinc-400">{loader}</span>
              <span
                className={
                  result.startsWith("Все")
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              >
                {result}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Modium<span className="text-violet-400">X</span>
          </span>
          <span>Найди моды. Собери сборку. Играй.</span>
        </div>
      </footer>
    </main>
  );
}

/*
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert h-5 w-[100px]"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the{" "}
            <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
              page.tsx
            </code>{" "}
            file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert h-[14px] w-4"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={14}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
*/