"use client";

import { usePathname } from "next/navigation";
import { moduloDe } from "@/lib/modulos";
import { Icone } from "./sidebar";

/** Ícone colorido da área atual, ao lado do título da tela. */
export function SeloModulo() {
  const m = moduloDe(usePathname());
  if (!m) return null;
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.selo}`} aria-hidden>
      <Icone d={m.icone} className="h-5 w-5" />
    </span>
  );
}
