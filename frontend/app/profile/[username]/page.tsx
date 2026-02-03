import { Metadata } from "next";
import { publicApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Github, Share2 } from "lucide-react";
import Link from "next/link";
import { HeatmapViewer } from "@/components/dashboard/heatmap-viewer";
import { ShareProfileButton } from "./share-profile";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;

  try {
    const profile = await publicApi.getProfile(username);
    const displayName = profile.user.name || profile.user.github_username;

    return {
      title: `${displayName} (@${profile.user.github_username})`,
      description: `${displayName}'s Docker Hub activity heatmap. Visualize container activity like GitHub commits.`,
      openGraph: {
        title: `${displayName}'s Docker Activity | Docker Heatmap`,
        description: `Visualize ${displayName}'s Docker Hub activity like GitHub commits.`,
        images: [
          {
            url: publicApi.getHeatmapUrl(username, { theme: "github" }),
            width: 800,
            height: 300,
            alt: `${displayName}'s Docker Heatmap`,
          },
        ],
      },
    };
  } catch {
    return {
      title: "Profile Not Found",
      description: "The requested Docker Heatmap profile could not be found.",
    };
  }
}

const ProfilePage = async ({ params }: PageProps) => {
  const { username } = await params;

  try {
    const profile = await publicApi.getProfile(username);

    return (
      <div className="min-h-screen bg-background">
        <main className="container py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            {/* Profile Header */}
            <div className="flex items-start gap-5">
              <Avatar className="h-20 w-20 border-2 border-muted shadow-sm">
                <AvatarImage src={profile.user.avatar_url} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10">
                  {profile.user.github_username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">
                  {profile.user.name || profile.user.github_username}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                  <Link
                    href={`https://github.com/${profile.user.github_username}`}
                    target="_blank"
                    className="flex items-center gap-1.5 hover:text-primary transition-colors bg-muted/50 px-2 py-0.5 rounded-md text-sm border"
                  >
                    <Github className="h-3.5 w-3.5" />
                    {profile.user.github_username}
                  </Link>
                  <span className="text-muted-foreground/30 hidden sm:inline">
                    |
                  </span>
                  <span className="flex items-center gap-1.5 bg-primary/5 text-primary px-2 py-0.5 rounded-md text-sm border border-primary/10 font-medium">
                    {profile.docker.username} (Docker Hub)
                  </span>
                </div>
                {profile.user.bio && (
                  <p className="text-base text-muted-foreground mt-3 max-w-xl leading-relaxed">
                    {profile.user.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShareProfileButton />
              <Button
                variant="default"
                size="sm"
                className="gap-2 shrink-0 shadow-sm"
                asChild
              >
                <Link
                  href={`https://hub.docker.com/u/${profile.docker.username}`}
                  target="_blank"
                >
                  <Share2 className="h-4 w-4" />
                  View Docker Hub
                </Link>
              </Button>
            </div>
          </div>

          {/* Heatmap Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Activity Heatmap
              </h2>
            </div>

            <div className="mx-auto w-fit shadow-2xl shadow-primary/5 rounded-xl overflow-hidden border">
              <HeatmapViewer username={username} options={{ days: 365 }} />
            </div>

            <p className="text-xs text-muted-foreground text-center italic">
              * Activity data is synced from Docker Hub repositories and tags
            </p>
          </div>

          {/* CTA */}
          <div className="mt-20 text-center border-t pt-16 pb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Want your own Docker activity heatmap?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
              Join developers who showcase their container activity on their
              GitHub READMEs.
            </p>
            <Link href="/">
              <Button
                size="lg"
                className="rounded-full px-10 shadow-lg shadow-primary/20 font-semibold"
              >
                Get started for free
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  } catch {
    return <NotFoundState />;
  }
};

const NotFoundState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 text-center">
    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-2">
      <ArrowLeft className="h-10 w-10 text-muted-foreground/50" />
    </div>
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">Profile not found</h1>
      <p className="text-muted-foreground max-w-xs mx-auto text-lg leading-relaxed">
        The user you&apos;re looking for doesn&apos;t exist, or they
        haven&apos;t connected their Docker Hub account yet.
      </p>
    </div>
    <Link href="/">
      <Button variant="outline" className="rounded-full px-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to homepage
      </Button>
    </Link>
  </div>
);

export default ProfilePage;
