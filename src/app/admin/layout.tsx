import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Sign In | Sweet1ne Live",
  icons: {
    icon: [
      { url: "/images/logo.png", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="light admin-root" data-theme="light">{children}</div>;
}
