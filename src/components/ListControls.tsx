"use client";

import type { LucideIcon } from "lucide-react";
import { LayoutGrid } from "lucide-react";

export type PageSize = number | "all";

export const PAGE_SIZE_OPTIONS: PageSize[] = [12, 24, 48, 96, "all"];

export interface SortOption<S extends string> {
  value: S;
  label: string;
  icon: LucideIcon;
}

export default function ListControls<S extends string>({
  sortBy,
  onSortByChange,
  sortOptions,
  pageSize,
  onPageSizeChange,
}: {
  sortBy: S;
  onSortByChange: (value: S) => void;
  sortOptions: SortOption<S>[];
  pageSize: PageSize;
  onPageSizeChange: (value: PageSize) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-full glass-card p-1 text-xs">
        <span className="hidden pl-2 text-white/35 sm:inline">Ordenar por</span>
        {sortOptions.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => onSortByChange(value)}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 font-medium transition-colors ${
              sortBy === value
                ? "bg-gradient-to-r from-neon-pink to-neon-violet text-white"
                : "text-white/55 hover:text-white"
            }`}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-1.5 rounded-full glass-card px-3 py-1.5 text-xs text-white/55">
        <LayoutGrid size={12} className="shrink-0" />
        <span className="hidden sm:inline">Por página</span>
        <select
          value={String(pageSize)}
          onChange={(e) => {
            const v = e.target.value;
            onPageSizeChange(v === "all" ? "all" : Number(v));
          }}
          className="cursor-pointer bg-transparent font-medium text-white outline-none [color-scheme:dark]"
        >
          {PAGE_SIZE_OPTIONS.map((opt) => (
            <option key={String(opt)} value={String(opt)} className="bg-card text-white">
              {opt === "all" ? "Todas" : opt}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
