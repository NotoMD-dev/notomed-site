import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #080d1a 0%, #111d3a 100%)",
          color: "#f4f6fb",
          padding: 72,
          fontFamily: "'Inter', 'Geist', 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 32,
            fontWeight: 500,
            opacity: 0.75,
          }}
        >
          physician-built tooling
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 80, fontWeight: 700, lineHeight: 1.05 }}>
            {siteConfig.shortName}
          </span>
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 36,
              fontWeight: 400,
              maxWidth: 720,
            }}
          >
            {siteConfig.headline}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              fontSize: 36,
              fontWeight: 600,
            }}
          >
            YA
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 600 }}>{siteConfig.founder.name}</span>
            <span style={{ fontSize: 24, opacity: 0.75 }}>
              {siteConfig.url.replace(/^https?:\/\//, "")}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
