import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Bodoni_Moda, Hanken_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthModalProvider } from "@/components/AuthModalProvider";
import AuthModal from "@/components/AuthModal";
import SmoothScroll from "@/components/motion/SmoothScroll";
import ScrollProgress from "@/components/motion/ScrollProgress";
import Analytics from "@/components/Analytics";
import { TrackingHead, TrackingNoScript } from "@/components/TrackingTags";
import { BRAND_TAGLINE } from "@/lib/brand";
import { resolveTheme, THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni-moda",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `Sweet1ne Live | ${BRAND_TAGLINE.replace(/\.$/, "")}`,
  description:
    "Premium dining, handcrafted drinks and unforgettable live experiences in one nocturnal setting.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/favicon-64x64.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/favicon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/favicon-256x256.png", sizes: "256x256", type: "image/png" },
      { url: "/icons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/favicon.ico", "/icons/favicon-64x64.png"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = resolveTheme(cookieStore.get(THEME_STORAGE_KEY)?.value);

  return (
    <html
      lang="en"
      className={`${theme} ${bodoniModa.variable} ${hankenGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <TrackingHead />
        {/* Material Symbols is an icon font with no next/font support; loaded globally here. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col overflow-x-clip selection:bg-primary-container selection:text-on-primary-container">
        <TrackingNoScript accepted={cookieStore.get("sweet1ne_cookie_consent")?.value === "accepted"} />
        <Analytics />
        <ThemeProvider initialTheme={theme}>
          <AuthProvider>
            <AuthModalProvider>
              <SmoothScroll>
                <ScrollProgress />
                {children}
                <AuthModal />
              </SmoothScroll>
            </AuthModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
