import React from "react";
import {
  Shield,
  Zap,
  RefreshCw,
  Palette,
  Code,
  BarChart3,
  LucideIcon,
} from "lucide-react";

interface FeatureProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const Feature = ({ icon: Icon, title, description }: FeatureProps) => (
  <div className="group relative p-6 rounded-xl border bg-card/50 hover:bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300" />
    <div className="relative">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

interface StepProps {
  num: number;
  title: string;
  description: string;
  isLast?: boolean;
}

export const Step = ({
  num,
  title,
  description,
  isLast = false,
}: StepProps) => (
  <div className="relative flex gap-5">
    {/* Connector line */}
    {!isLast && (
      <div className="absolute left-[19px] top-12 w-0.5 h-[calc(100%-24px)] bg-gradient-to-b from-primary/30 to-primary/5" />
    )}

    {/* Number circle */}
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25">
      {num}
    </div>

    <div className="pb-8">
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

// Pre-configured features
export const features = [
  {
    icon: Code,
    title: "Embeddable SVG",
    description:
      "One URL. Works in GitHub README, websites, or anywhere that renders images. No JavaScript required.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description:
      "Your Docker Hub access token is encrypted with AES-256-GCM. Never stored in plaintext, ever.",
  },
  {
    icon: RefreshCw,
    title: "Auto Sync",
    description:
      "Activity updates automatically in the background. Manual sync also available from your dashboard.",
  },
  {
    icon: Palette,
    title: "16+ Themes",
    description:
      "GitHub, Dracula, Nord, Tokyo Night, and more. Customize colors, size, and corner radius.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "SVGs are cached and served via CDN. Sub-100ms response times worldwide.",
  },
  {
    icon: BarChart3,
    title: "Rich Analytics",
    description:
      "Track pushes, pulls, and builds. Detailed breakdowns by repository and time period.",
  },
];

// Pre-configured steps
export const steps = [
  {
    num: 1,
    title: "Sign in with GitHub",
    description:
      "Quick OAuth login using your GitHub account. No passwords to remember, no email verification.",
  },
  {
    num: 2,
    title: "Connect Docker Hub",
    description:
      "Enter your Docker Hub username and personal access token. Token is encrypted immediately.",
  },
  {
    num: 3,
    title: "Embed in your README",
    description:
      "Copy the SVG URL or Markdown snippet and paste it into your profile. That's it!",
  },
];
