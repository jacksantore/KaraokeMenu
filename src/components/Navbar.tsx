"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Mic2, ListMusic } from "lucide-react";
import EqualizerIcon from "./EqualizerIcon";

const LINKS = [
  { href: "/", label: "Buscar", icon: Mic2 },
  { href: "/gerenciar", label: "Gerenciar", icon: ListMusic },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <EqualizerIcon className="group-hover:opacity-100 opacity-80 transition-opacity" />
          <span className="font-display text-2xl tracking-wider gradient-text">
            KARAOKÊ MENU
          </span>
        </Link>

        <nav className="flex items-center gap-1 rounded-full glass-card p-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className="relative">
                <span
                  className={`relative z-10 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors sm:px-4 ${
                    active ? "text-white" : "text-white/60 hover:text-white/90"
                  }`}
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{label}</span>
                </span>
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-pink to-neon-violet"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
