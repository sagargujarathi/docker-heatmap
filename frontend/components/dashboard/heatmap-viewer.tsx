"use client";

import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import { Loader2 } from "lucide-react";
import type { SVGOptions } from "@/lib/schemas";
import { HeatmapGrid } from "@/components/shared/heatmap-grid";

interface HeatmapViewerProps {
  username: string;
  options?: SVGOptions;
}

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const HeatmapViewer = ({ username, options }: HeatmapViewerProps) => {
  const days = options?.days || 365;
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["activity", username, days],
    queryFn: () => publicApi.getActivity(username, days),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 bg-muted/10 rounded-lg min-h-[200px] w-full max-w-[800px] mx-auto">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.activity) {
    return (
      <div className="flex items-center justify-center py-12 bg-muted/10 rounded-lg text-muted-foreground min-h-[200px] w-full max-w-[800px] mx-auto">
        Failed to load activity data
      </div>
    );
  }

  // Determine theme based on options or application theme
  const getThemeId = () => {
    if (options?.theme) return options.theme;
    if (!mounted) return "github"; // Default during SSR
    return resolvedTheme === "light" ? "github-light" : "github";
  };

  return (
    <HeatmapGrid
      data={data.activity}
      username={username}
      themeId={getThemeId()}
      hideLegend={options?.hide_legend}
      totalCount={data.totals?.activities}
    />
  );
};
