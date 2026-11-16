import { Cormorant_Garamond, Inter, Italiana } from "next/font/google";

/* =========================================================================
   The three families, self-hosted.

   They used to arrive through an `@import` inside globals.css, which meant
   the browser had to download and parse our stylesheet before it even asked
   for a font: two serialised round-trips to a third party, and a 300px hero
   word that reflowed after first paint. `next/font` inlines the faces at
   build time, preloads them, and generates a size-adjusted fallback, so
   nothing moves once the real face lands.
   ------------------------------------------------------------------------- */

export const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--f-serif",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--f-sans",
  fallback: ["-apple-system", "Helvetica Neue", "Arial", "sans-serif"],
});

export const display = Italiana({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--f-display",
  fallback: ["Georgia", "serif"],
});

export const fontClass = `${serif.variable} ${sans.variable} ${display.variable}`;
