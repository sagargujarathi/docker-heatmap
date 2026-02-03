"use client";

import { useState, useMemo } from "react";
import {
  HeatmapGrid,
  type HeatmapData,
} from "@/components/shared/heatmap-grid";
import { themes } from "@/lib/themes";

export const HeatmapPreview = () => {
  const [activeTheme, setActiveTheme] = useState("github");

  const mockData = useMemo(() => {
    const data: HeatmapData[] = [];
    const today = new Date();

    // Generate 364 days of data (52 weeks)
    // To match row-major logic, we generate 7 rows * 52 cols
    for (let col = 0; col < 52; col++) {
      for (let row = 0; row < 7; row++) {
        const daysAgo = (51 - col) * 7 + (6 - row);
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);

        const val =
          Math.sin(row * 0.5) * Math.cos(col * 0.2) * 5 + ((row + col) % 5);
        const level = Math.abs(Math.floor(val)) % 5;
        const counts = [0, 1, 3, 5, 8];

        data.push({
          date: date.toISOString(),
          count: counts[level],
          level: level,
        });
      }
    }
    return data;
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Theme Selector */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Object.entries(themes).map(([key, t]) => (
          <button
            key={key}
            onClick={() => setActiveTheme(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
              activeTheme === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent hover:border-muted-foreground/30"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <HeatmapGrid
        data={mockData}
        username="dockeruser"
        themeId={activeTheme}
        totalCount={1247}
      />
    </div>
  );
};
