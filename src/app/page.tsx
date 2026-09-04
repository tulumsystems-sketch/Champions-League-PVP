"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Crosshair,
  Play,
  Swords,
  Trophy,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { StaggerIn } from "@/components/motion/StaggerIn";
import { PlayerUltimateCard } from "@/components/presentation/PlayerUltimateCard";
import { cn } from "@/lib/utils";

import "./landing.css";

const navLinks = [
  { href: "/", label: "inicio" },
  { href: "#ecosistema", label: "arena" },
  { href: "#flujo", label: "cómo se juega" },
  { href: "#cta", label: "contacto" },
];

const modes = [
  {
    id: "1v1",
    label: "Duelo",
    copy: "Uno contra uno. Vuelve cuando la validación sea automática.",
    image: "/landing/mode-1v1.png",
  },
  {
    id: "2v2",
    label: "Dúo",
    copy: "Sincronía y trade. Duelos privados, todavía en construcción.",
    image: "/landing/mode-2v2.png",
  },
  {
    id: "4v4",
    label: "Escuadra",
    copy: "Cuatro vs cuatro. Salas privadas, próximo release.",
    image: "/landing/mode-4v4.png",
  },
];

const modules = [
  {
    title: "Desafíos PvP",
    copy: "Torneos Battle Royale: te inscribís, jugás partidas de Free Fire y la métrica se sincroniza sola.",
    href: "/challenges",
    image: "/landing/module-desafios.png",
    featured: true,
  },
  {
    title: "Salas privadas",
    copy: "1v1 a 4v4 con validación automática. En construcción para el próximo release.",
    href: "/rooms",
    image: "/landing/module-salas.png",
    soon: true,
  },
  {
    title: "Ranking",
    copy: "Tabla global de la temporada. Los de arriba se ven.",
    href: "/ranking",
    image: "/landing/module-ranking.png",
  },
  {
    title: "Wallet",
    copy: "Carga, balance y retiro en un mismo lugar.",
    href: "/wallet",
    image: "/landing/module-wallet.png",
  },
];

export default function HomePage() {
  const [activeMode, setActiveMode] = useState(modes[2].id);

  return (
    <div className="landing-root">
      <header className="landing-header sticky top-0 z-40">
        <div className="mx-auto grid max-w-[1380px] grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:px-10">
          <Link href="/" className="font-heading text-2xl font-bold tracking-[0.18em] text-white">
            CLP
          </Link>
          <nav className="hidden items-center justify-center gap-8 lg:flex">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13px] lowercase tracking-wide text-white/70 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 justify-self-end">
            <Link href="/register" className="hidden text-sm text-white/70 transition hover:text-white sm:inline">
              Crear cuenta
            </Link>
            <Link href="/login" className="landing-nav-cta">
              Ingresar
            </Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-[calc(100svh-3.6rem)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-[#040204]" />
          <div className="absolute inset-0 lg:hidden">
            <Image
              src="/landing/hero-champion.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_18%] opacity-45"
            />
          </div>
          <div className="absolute inset-y-0 right-0 hidden w-[64%] lg:block">
            <Image
              src="/landing/hero-champion.png"
              alt=""
              fill
              priority
              sizes="64vw"
              className="object-cover object-[center_12%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#040204] via-[#040204]/35 to-transparent" />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(900px_480px_at_12%_0%,rgba(255,22,56,0.16),transparent_56%)]" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#040204] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#040204] via-[#040204]/70 to-transparent" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100svh-3.6rem)] max-w-[1380px] flex-col px-4 py-5 sm:px-6 lg:px-10">
          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-6">
            <div className="max-w-xl">
              <p className="text-sm font-semibold tracking-wide text-red-400">
                Un nuevo universo, una nueva temporada
              </p>
              <h1 className="mt-4 font-heading text-[3.2rem] font-bold leading-[0.88] tracking-tight text-white sm:text-7xl lg:text-[5.4rem]">
                CHAMPIONS
                <span className="block">LEAGUE PVP</span>
              </h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/70 sm:text-base">
                Competí en torneos Battle Royale de Free Fire. Te inscribís con Coins, jugás tus partidas y la métrica se sincroniza sola.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register" className="landing-btn">
                  Crear cuenta
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="#flujo" className="landing-nav-cta">
                  Cómo se juega
                </Link>
              </div>
              <div className="mt-6 flex items-center gap-4 text-white/50">
                <Swords className="size-5" />
                <UsersRound className="size-5" />
                <Trophy className="size-5" />
                <WalletCards className="size-5" />
                <Crosshair className="size-5" />
              </div>
            </div>

            <aside className="relative z-10 mx-auto w-[280px] sm:w-[300px]">
              <PlayerUltimateCard
                player={{
                  name: "Champion",
                  avatarUrl: "/landing/hero-champion.png",
                  initials: "CL",
                  uid: "Tu UID",
                  region: "BR",
                  clan: "CLP",
                  level: 72,
                  rank: 19,
                  rankingPoints: 4680,
                  likes: 12840,
                  kills: 9420,
                  wins: 318,
                  headshots: 2140,
                  position: "FF",
                }}
              />
              <p className="mt-3 text-center text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
                Carta de jugador · temporada CLP
              </p>
            </aside>
          </div>

          <div className="grid items-end gap-6 pb-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="mb-3 text-sm font-medium text-white">Duelos privados · próximamente</p>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:overflow-visible lg:px-0">
                {modes.map((mode) => {
                  const active = mode.id === activeMode;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      data-active={active}
                      onClick={() => setActiveMode(mode.id)}
                      className={cn(
                        "landing-portrait relative shrink-0 overflow-hidden rounded-2xl text-left ring-1 ring-white/10 transition",
                        active ? "h-52 w-44 sm:w-52" : "h-40 w-28 sm:w-32",
                      )}
                    >
                      <Image
                        src={mode.image}
                        alt=""
                        fill
                        sizes="208px"
                        className="object-cover"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/10" />
                      <span className="absolute left-3 top-3 z-10 text-[11px] font-bold tracking-[0.18em] text-white/80">
                        {mode.id}
                      </span>
                      <span className="absolute right-3 top-3 z-10 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-200">
                        Pronto
                      </span>
                      {active ? (
                        <span className="absolute inset-x-0 bottom-0 z-10 p-3">
                          <span className="block font-heading text-lg font-bold text-white">{mode.label}</span>
                          <span className="mt-1 block text-[11px] leading-4 text-white/65">{mode.copy}</span>
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex w-40 gap-1">
                {modes.map((mode) => (
                  <span
                    key={mode.id}
                    className={cn(
                      "h-0.5 flex-1 rounded-full",
                      mode.id === activeMode ? "bg-white" : "bg-white/20",
                    )}
                  />
                ))}
              </div>
            </div>

            <Link href="#flujo" className="landing-glass flex items-center gap-4 rounded-2xl p-3 transition hover:border-red-500/40 sm:p-4">
              <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
                <Image
                  src="/landing/arena-preview.png"
                  alt=""
                  fill
                  sizes="144px"
                  className="object-cover"
                />
                <span className="absolute inset-0 grid place-items-center bg-black/25">
                  <span className="grid size-11 place-items-center rounded-full bg-white text-black">
                    <Play className="size-4 fill-black" />
                  </span>
                </span>
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-white">Cómo se juega</p>
                <p className="mt-1 text-xs leading-5 text-white/60 sm:text-sm">
                  Inscribite al torneo, jugá Battle Royale en Free Fire y sincronizá stats. El ranking cuenta lo que sumes desde que entraste.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section id="ecosistema" className="relative border-t border-white/8 bg-[#070306] py-20">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">Ecosistema</p>
            <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Torneos, ranking y wallet
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/55">
              El MVP corre por desafíos Battle Royale. Las salas 1v1 a 4v4 vuelven cuando la validación sea automática.
            </p>
          </div>

          <StaggerIn className="mt-10 grid gap-4 lg:grid-cols-12">
            {modules.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "landing-glass group relative overflow-hidden rounded-3xl p-7 transition duration-300 hover:-translate-y-1 hover:border-red-500/40",
                  item.featured ? "min-h-[340px] lg:col-span-7 lg:row-span-3" : "min-h-[220px] lg:col-span-5",
                )}
              >
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes={item.featured ? "60vw" : "40vw"}
                  className="object-cover opacity-35 transition group-hover:opacity-45"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070306] via-[#070306]/70 to-black/20" />
                <div className="relative z-10">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-400">
                    {item.soon ? "Próximamente" : item.featured ? "Principal" : "Módulo"}
                  </p>
                  <h3 className="mt-6 font-heading text-3xl font-bold text-white">{item.title}</h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/70">{item.copy}</p>
                  <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white/80">
                    {item.soon ? "En construcción" : "Entrar"}
                    <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </StaggerIn>
        </div>
      </section>

      <section id="flujo" className="bg-[#040204] py-20">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">Flujo</p>
          <h2 className="mt-3 font-heading text-4xl font-bold text-white sm:text-5xl">Tres pasos</h2>
          <div className="mt-12 grid gap-0 md:grid-cols-3">
            {[
              { step: "01", title: "Vinculá UID", copy: "Tu cuenta de Free Fire queda identificada para competir." },
              { step: "02", title: "Cargá Coins", copy: "Transferí, un admin acredita, y entras al torneo." },
              { step: "03", title: "Jugá y cobrá", copy: "Battle Royale en Free Fire, sincronizá stats y el admin cierra el premio." },
            ].map((item, index) => (
              <article
                key={item.step}
                className={cn(
                  "relative px-1 py-2 md:px-8",
                  index > 0 && "md:border-l md:border-red-500/25",
                )}
              >
                <p className="font-heading text-6xl font-bold text-red-500/80">{item.step}</p>
                <h3 className="mt-6 font-heading text-2xl font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/50">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#0a0406]">
        <div className="mx-auto grid max-w-[1380px] grid-cols-2 lg:grid-cols-4">
          {[
            { value: "BR", label: "Torneos Free Fire" },
            { value: "1:1", label: "Coin / USD" },
            { value: "1° 2° 3°", label: "Premios fijos" },
            { value: "API", label: "Stats oficiales" },
          ].map((item, index) => (
            <div key={item.label} className="relative px-6 py-10">
              {index > 0 ? (
                <span className="landing-stat-rule absolute inset-y-6 left-0 hidden w-px lg:block" />
              ) : null}
              <p className="font-heading text-4xl font-bold text-white">{item.value}</p>
              <p className="mt-2 text-sm text-white/45">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="cta" className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(680px_280px_at_50%_0%,rgba(255,22,56,0.22),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-4xl font-bold text-white sm:text-6xl">Entrá a la temporada</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/55">
            Creá tu cuenta, vinculá el UID y metete al primer torneo de la arena.
          </p>
          <Link href="/register" className="landing-btn mt-8">
            Crear cuenta
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/8 px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 text-xs text-white/40">
          <p className="font-heading tracking-[0.2em] text-white/70">CLP</p>
          <p>Champions League PVP · arena competitiva de Free Fire</p>
          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/login" className="hover:text-white">
              Ingresar
            </Link>
            <Link href="/register" className="hover:text-white">
              Crear cuenta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
