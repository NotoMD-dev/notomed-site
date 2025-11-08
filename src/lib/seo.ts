import type { Metadata } from "next";

const siteUrl = "https://www.notomed.dev";

export const siteConfig = {
  name: "NotoMed.dev",
  shortName: "NotoMed",
  url: siteUrl,
  headline: "Physician-built clinical tools for inpatient medicine",
  description:
    "Physician-built clinical tools for inpatient medicine that combine AI-assisted safety checks with evidence-based guidance to streamline rounding workflows.",
  keywords: [
    "clinical decision support",
    "inpatient medicine tools",
    "medical calculators",
    "opioid conversion",
    "hyponatremia calculator",
    "physician built apps",
    "AI assisted medicine",
    "hospital medicine workflows",
  ],
  founder: {
    name: "Yasmine Abbey, MD, MSc",
    twitter: "@yasmineabbey",
  },
  socialImage: "/opengraph-image",
} as const;

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.headline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [
    {
      name: siteConfig.founder.name,
      url: `${siteConfig.url}/about`,
    },
  ],
  creator: siteConfig.founder.name,
  publisher: siteConfig.name,
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.headline}`,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.socialImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} social card`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | ${siteConfig.headline}`,
    description: siteConfig.description,
    creator: siteConfig.founder.twitter,
    site: siteConfig.founder.twitter,
    images: [siteConfig.socialImage],
  },
  robots: {
    index: true,
    follow: true,
  },
  category: "health",
};

export const aboutMetadata: Metadata = {
  title: "About NotoMed.dev",
  description:
    "Meet physician-founder Yasmine Abbey, MD, MSc and learn how NotoMed.dev builds AI-assisted inpatient medicine tools that make rounding more efficient.",
  alternates: {
    canonical: `${siteConfig.url}/about`,
  },
  openGraph: {
    type: "profile",
    url: `${siteConfig.url}/about`,
    title: "About NotoMed.dev",
    description:
      "Learn about NotoMed.dev and physician-founder Yasmine Abbey, MD, MSc, who builds AI-assisted inpatient medicine tools to streamline hospital medicine workflows.",
    images: [
      {
        url: siteConfig.socialImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} social card`,
      },
    ],
    firstName: "Yasmine",
    lastName: "Abbey",
  },
  twitter: {
    card: "summary_large_image",
    title: "About NotoMed.dev",
    description:
      "Meet physician-founder Yasmine Abbey, MD, MSc and see how NotoMed.dev builds AI-assisted inpatient medicine tools for hospital teams.",
    images: [siteConfig.socialImage],
  },
};

export function absoluteUrl(path: string) {
  return new URL(path, siteConfig.url).toString();
}
