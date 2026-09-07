import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Cookie Policy | Sweet1ne Live",
  description: "How Sweet1ne Live uses essential, analytics and advertising cookies.",
};

export default function CookiePolicyPage() {
  return (
    <>
      <Nav active="" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-margin-mobile pb-24 pt-32 md:px-gutter md:pt-40">
        <p className="font-label-caps text-[11px] uppercase tracking-[0.28em] text-primary">Privacy</p>
        <h1 className="mt-3 font-headline-lg text-[42px] leading-tight md:text-[58px]">Cookie policy</h1>
        <p className="mt-5 max-w-2xl text-on-surface-variant">Last updated 3 September 2026</p>
        <div className="mt-12 space-y-10 text-[16px] leading-7 text-on-surface-variant">
          <Policy title="What cookies are">Cookies are small text files stored by your browser. They help a website remember choices and, where you agree, measure how the site and advertising perform.</Policy>
          <Policy title="Essential cookies">These support features such as theme preferences, account sessions, security and remembering your cookie choice. They are required for the site to work and cannot be switched off through the cookie notice.</Policy>
          <Policy title="Optional analytics and advertising">If you select “Accept all”, we may load Google Tag Manager, Google Analytics and the Meta Pixel. These services can measure page visits, campaign performance and interactions. Google and Meta may process identifiers and usage information under their own privacy terms.</Policy>
          <Policy title="Your choice">Optional tracking does not load until you consent. Your choice is remembered for up to 12 months. Use “Cookie settings” in the footer at any time to change it. You can also remove cookies using your browser settings.</Policy>
          <Policy title="Contact">If you have a question about our use of cookies, contact us through the website’s contact page.</Policy>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Policy({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="font-headline-md text-[28px] text-on-surface">{title}</h2><p className="mt-3">{children}</p></section>;
}
