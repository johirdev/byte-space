import { ImageResponse } from "next/og";

// Default social card for every page that doesn't set its own image.
export const alt = "ByteSpace — Learn practical skills from verified creators";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #071e5f 0%, #0445ff 60%, #4f9dff 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#ffffff",
              color: "#0445ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            B
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>ByteSpace</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, maxWidth: 960 }}>
            Learn practical skills from verified creators
          </div>
          <div style={{ fontSize: 30, opacity: 0.85, maxWidth: 900 }}>
            Design, development, marketing and business courses — learn at your own pace.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 26, opacity: 0.8 }}>bytespacebd.vercel.app</div>
      </div>
    ),
    size,
  );
}
