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
      { url: "/images/logo.png", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
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
        {/* Material Symbols is an icon font with no next/font support; loaded globally here. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col overflow-x-clip selection:bg-primary-container selection:text-on-primary-container">
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
