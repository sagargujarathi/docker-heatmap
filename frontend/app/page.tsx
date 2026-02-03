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
        <section className="container flex flex-col items-center justify-center gap-6 py-24 md:py-32 text-center">
          <Image
            src="/logo.webp"
            alt="Docker Heatmap Large Logo"
            width={180}
            height={180}
            className="mb-6 animate-in fade-in zoom-in duration-1000"
            priority
          />
          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary font-medium">
              Open source · Free forever
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-balance max-w-3xl">
            Docker Hub activity heatmaps for your README
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl text-balance">
            Generate embeddable contribution graphs that automatically update.
            Show your container activity like GitHub shows commits.
          </p>

          <HeroCTA stars={stars} />
        </section>

        {/* Preview */}
        <section className="container pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Try different themes</h2>
            <p className="text-muted-foreground">
              Hover over tiles to see details • Click a theme to preview
            </p>
          </div>
          <HeatmapPreview />
        </section>

        {/* Features */}
        <section className="container py-20 border-t">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for developers who want to showcase their Docker Hub
              activity without the hassle.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        <section className="container py-20 border-t">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Get started in minutes
              </h2>
              <p className="text-muted-foreground mb-8">
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
            <div className="relative">
              <div className="rounded-xl border bg-zinc-950 p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-3 text-xs text-zinc-500">README.md</span>
                </div>
                <pre className="text-sm text-zinc-300 overflow-x-auto">
                  <code>{`# My Awesome Project

## Docker Activity

![Docker Heatmap](https://dockerheatmap.dev/api/heatmap/username.svg)

## About
...`}</code>
                </pre>
              </div>
              {/* Decorative glow */}
              <div className="absolute -inset-4 bg-primary/10 blur-3xl -z-10 rounded-full" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
