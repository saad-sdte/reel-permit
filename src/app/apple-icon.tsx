import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#16332b",
          borderRadius: 40,
        }}
      >
        <svg width="118" height="118" viewBox="0 0 32 32">
          <g fill="none" stroke="#c4a574" strokeLinecap="round">
            <circle cx="14" cy="16" r="7.4" strokeWidth="2.2" />
            <circle cx="14" cy="16" r="4.1" strokeWidth="1.6" />
            <path d="M21.2 12.8c2.8-1.4 5.6-.3 7.6 4.6" strokeWidth="1.8" />
          </g>
          <circle cx="14" cy="16" r="1.55" fill="#c4a574" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
