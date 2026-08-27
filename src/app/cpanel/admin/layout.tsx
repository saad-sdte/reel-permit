import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { AdminThemeProvider } from "@/components/admin/admin-theme";
import "./admin.css";

const adminFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-admin-face",
});

export const metadata: Metadata = {
  title: {
    default: "Control panel",
    template: "%s · ReelPermit",
  },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={adminFont.variable} style={{ fontFamily: "var(--font-admin-face), ui-sans-serif, system-ui, sans-serif" }}>
      <AdminThemeProvider>{children}</AdminThemeProvider>
    </div>
  );
}
