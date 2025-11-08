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
          padding: "72px",
          fontFamily: "'Inter', 'Geist', 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 500, opacity: 0.75 }}>physician-built tooling</div>
        <div>
          <div style={{ fontSize: 80, fontWeight: 700, lineHeight: 1.05 }}>{siteConfig.shortName}</div>
          <div style={{ fontSize: 36, fontWeight: 400, marginTop: 16, maxWidth: 720 }}>
            {siteConfig.headline}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 600,
            }}
          >
            YA
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 28, fontWeight: 600 }}>{siteConfig.founder.name}</span>
            <span style={{ fontSize: 24, opacity: 0.75 }}>{siteConfig.url.replace(/^https?:\/\//, "")}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
