import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { readSettings } from "@/lib/settings";
import { I18nProvider } from "@/components/lang-toggle";

export const metadata: Metadata = {
  title: "Luxora — Luxury Store",
  description: "Luxury fashion, perfumes, watches, accessories and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme } = readSettings();

  const cssVars = `
    :root{
      --lux-ink: ${theme.ink};
      --lux-ivory: ${theme.ivory};
      --lux-gold: ${theme.gold};
      --lux-muted: ${theme.muted};
      --lux-radius: ${theme.radius}px;
      --lux-font: ${theme.font};
      --lux-base: ${theme.baseFontSize}px;
      --lux-hscale: ${theme.headingScale};
      --lux-container: ${theme.containerMax};
      --lux-hero-overlay: ${theme.heroOverlayOpacity};
    }
  `;

  return (
    <html lang="ar" dir="rtl">
      <body>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        <I18nProvider>
          <div className="min-h-dvh bg-ink text-ivory bg-radial-gold lux-font">
            <Navbar />
            {/* Use full width to better utilize large screens. Individual sections/cards still keep a premium spacing. */}
            <main className="w-full px-6 pb-16 pt-6">
              {children}
            </main>
            <Footer />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
