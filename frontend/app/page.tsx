import { Metadata } from "next";
import Image from "next/image";
import { HeatmapPreview } from "@/components/landing/heatmap-preview";
import { Feature, Step, features, steps } from "@/components/landing/sections";
import { HeroCTA } from "@/components/landing/hero-cta";

export const metadata: Metadata = {
  title: "Docker Heatmap | Visualize Your Container Activity",
  description:
    "Generate stunning, embeddable SVG contribution heatmaps for your Docker Hub activity. Perfect for your GitHub README and developer profiles.",
};

const getGitHubStars = async () => {
  try {
    const res = await fetch(
      "https://api.github.com/repos/sagargujarathi/docker-heatmap",
      {
        next: { revalidate: 3600 }, // Cache stars for 1 hour
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.stargazers_count as number;
  } catch {
    return null;
  }
};

const HomePage = async () => {
  const stars = await getGitHubStars();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        {/* Hero */}
        <section className="container flex flex-col items-center justify-center gap-6 py-16 md:py-32 text-center">
          <Image
            src="/logo.webp"
            alt="Docker Heatmap Large Logo"
            width={120}
            height={120}
            className="mb-4 animate-in fade-in zoom-in duration-1000 md:w-[180px] md:h-[180px]"
            priority
          />
          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] sm:text-xs text-primary font-medium">
              Open source · Free forever
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-balance max-w-3xl leading-[1.1]">
            Docker Hub activity heatmaps for your README
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl text-balance">
            Generate embeddable contribution graphs that automatically update.
            Show your container activity like GitHub shows commits.
          </p>

          <HeroCTA stars={stars} />
        </section>

        {/* Preview */}
        <section className="container pb-20 md:pb-32">
          <div className="text-center mb-8 px-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              Try different themes
            </h2>
            <p className="text-sm text-muted-foreground">
              Hover over tiles to see details • Click a theme to preview
            </p>
          </div>
          <HeatmapPreview />
        </section>

        {/* Features */}
        <section className="container py-16 md:py-24 border-t">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Everything you need
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Built for developers who want to showcase their Docker Hub
              activity without the hassle.
            </p>
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Feature
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="container py-16 md:py-24 border-t">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Get started in minutes
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-8">
                No complex setup required. Connect your Docker Hub account and
                start showcasing your activity immediately.
              </p>
              <div className="space-y-0">
                {steps.map((step, index) => (
                  <Step
                    key={step.num}
                    num={step.num}
                    title={step.title}
                    description={step.description}
                    isLast={index === steps.length - 1}
                  />
                ))}
              </div>
            </div>

            {/* Code preview */}
            <div className="relative min-w-0">
              <div className="rounded-xl border bg-zinc-950 p-4 sm:p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="ml-2 text-[10px] text-zinc-500 font-mono">
                    README.md
                  </span>
                </div>
                <pre className="text-[11px] sm:text-sm text-zinc-300 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
                  <code>{`# My Awesome Project

## Docker Activity

![Docker Heatmap](https://dockerheatmap.dev/api/heatmap/username.svg)

## About
...`}</code>
                </pre>
              </div>
              {/* Decorative glow */}
              <div className="absolute -inset-4 bg-primary/10 blur-3xl -z-10 rounded-full hidden sm:block" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
