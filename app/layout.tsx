import type { Metadata, Viewport } from "next";
import { fontClass } from "./fonts";
import "./globals.css";

const DESCRIPTION =
  "An accountability club for principal dentists. One partner, chosen and asked by you — and a morning inside each other's practices, twice a year at most.";

export const metadata: Metadata = {
  metadataBase: new URL("https://tpc-accountability.vercel.app"),
  title: {
    default: "The Principals Club — Kept",
    template: "%s · The Principals Club",
  },
  description: DESCRIPTION,
  applicationName: "The Principals Club",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "The Principals Club",
    title: "A partner, and two mornings a year.",
    description: DESCRIPTION,
    locale: "en_GB",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "The Principals Club — a partner, and two mornings a year." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "A partner, and two mornings a year.",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The Principals Club",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C1217",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={fontClass}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

function ServiceWorkerRegister() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/sw.js').catch(function () {});
            });
          }
        `,
      }}
    />
  );
}
