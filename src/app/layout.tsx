import type { Metadata, Viewport } from "next";
import { Figtree, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/features/ServiceWorkerRegister";
import { BusyProvider } from "@/components/features/BusyProvider";

// Fontes auto-hospedadas pelo next/font (sem requisição ao Google em runtime; funciona offline no PWA).
// Figtree: texto, campos, botões e listas. Bricolage Grotesque: títulos e números grandes.
const figtree = Figtree({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-figtree" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-bricolage" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f16" },
  ],
};

export const metadata: Metadata = {
  title: "Cadê Meu Dinheiro?",
  description: "Controle inteligente de finanças pessoais e PJ",
  applicationName: "Cadê Meu Dinheiro?",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cadê Meu Dinheiro?",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

function ThemeInitScript() {
  const code = `(() => {
    try {
      const stored = localStorage.getItem('cmd_theme');
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', theme === 'dark');
    } catch (_) {}
  })();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${figtree.variable} ${bricolage.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeInitScript />
        <ServiceWorkerRegister />
        <BusyProvider>{children}</BusyProvider>
      </body>
    </html>
  );
}
