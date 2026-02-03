export interface HeatmapTheme {
  name: string;
  bg: string;
  colors: string[];
}

export const themes: Record<string, HeatmapTheme> = {
  github: {
    name: "GitHub Dark",
    bg: "#0d1117",
    colors: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
  },
  "github-light": {
    name: "GitHub Light",
    bg: "#ffffff",
    colors: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  },
  docker: {
    name: "Docker",
    bg: "#0d1117",
    colors: ["#1a1d21", "#0063a5", "#0080c9", "#00a1e5", "#00c4ff"],
  },
  dracula: {
    name: "Dracula",
    bg: "#282a36",
    colors: ["#44475a", "#6272a4", "#8be9fd", "#50fa7b", "#ff79c6"],
  },
  nord: {
    name: "Nord",
    bg: "#2e3440",
    colors: ["#3b4252", "#5e81ac", "#81a1c1", "#88c0d0", "#8fbcbb"],
  },
  "tokyo-night": {
    name: "Tokyo Night",
    bg: "#1a1b26",
    colors: ["#24283b", "#414868", "#7aa2f7", "#bb9af7", "#ff9e64"],
  },
};
