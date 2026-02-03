"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { themes } from "@/lib/themes";

export interface HeatmapData {
  date: string;
  count: number;
  level: number;
}

interface HeatmapGridProps {
  data: HeatmapData[];
  username: string;
  themeId?: string;
  hideLegend?: boolean;
  totalCount?: number;
}

export const HeatmapGrid = ({
  data,
  username,
  themeId = "github",
  hideLegend = false,
  totalCount,
}: HeatmapGridProps) => {
  const theme = themes[themeId] || themes.github;
  const isLightTheme = themeId === "github-light";

  // Reverting to the logic used in the original landing page preview:
  // Renders 7 rows of 52 columns.
  const rows = [0, 1, 2, 3, 4, 5, 6];
  const numCols = Math.ceil(data.length / 7);

  const getCellData = (row: number, col: number) => {
    const index = col * 7 + row;
    return data[index];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculatedTotal =
    totalCount ?? data.reduce((sum, d) => sum + d.count, 0);

  return (
    <TooltipProvider delayDuration={100}>
      <div
        className="rounded-lg p-4 sm:p-6 mx-auto transition-colors duration-300 w-fit max-w-full"
        style={{ backgroundColor: theme.bg }}
      >
        {/* Header */}
        <div
          className={`text-sm mb-4 flex items-center justify-between ${
            isLightTheme ? "text-gray-600" : "text-gray-400"
          }`}
        >
          <span className="font-medium text-xs sm:text-sm">
            @{username} Docker Activity
          </span>
          <span className="text-xs sm:text-sm">
            {calculatedTotal.toLocaleString()} total
          </span>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto w-full">
          <div className="flex flex-col gap-[3px] min-w-fit mx-auto p-2">
            {rows.map((row) => (
              <div key={row} className="flex gap-[3px] justify-start">
                {Array.from({ length: numCols }).map((_, col) => {
                  const day = getCellData(row, col);
                  if (!day)
                    return <div key={col} className="w-[11px] h-[11px]" />;

                  return (
                    <Tooltip key={`${row}-${col}`}>
                      <TooltipTrigger asChild>
                        <div
                          className="w-[11px] h-[11px] rounded-[1.5px] transition-transform hover:scale-150 active:scale-95 cursor-default flex-shrink-0 relative z-0 hover:z-10"
                          style={{ backgroundColor: theme.colors[day.level] }}
                        />
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="text-[10px] sm:text-xs"
                      >
                        <p className="font-medium">{formatDate(day.date)}</p>
                        <p className="text-muted-foreground">
                          {day.count === 0
                            ? "No activities"
                            : `${day.count} ${day.count === 1 ? "activity" : "activities"}`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer - Legend */}
        {!hideLegend && (
          <div
            className={`flex items-center justify-end gap-2 mt-4 text-[10px] sm:text-xs ${
              isLightTheme ? "text-gray-500" : "text-gray-500"
            }`}
          >
            <span>Less</span>
            {theme.colors.map((color, i) => (
              <div
                key={i}
                className="w-[10px] h-[10px] rounded-[1.5px]"
                style={{ backgroundColor: color }}
              />
            ))}
            <span>More</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
