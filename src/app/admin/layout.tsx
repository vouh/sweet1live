import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Sign In | Sweet1ne Live",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="light admin-root" data-theme="light">{children}</div>;
}
