import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import "./globals.css";

/*
  Only a Latin face is downloaded. Shippori Mincho and M PLUS 1 Code were the
  first choice, but Google serves CJK families as hundreds of unicode-range
  slices and next/font materialises all of them: measured at 363 woff2 files,
  10 MB, with ~124 referenced by the page. Unacceptable for a form.

  So the Japanese text uses the reader's own mincho — Hiragino or Yu Mincho are
  already on the machine — and Newsreader carries the Latin. Pairing a Latin
  serif with a system mincho is what Japanese print design does anyway, so this
  is the authentic arrangement rather than a concession.
*/
const display = Newsreader({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ccverbs — write a verb set",
  description:
    "Choose the words Claude Code shows you while it works. Write a list, watch it in the spinner, open a pull request.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={display.variable}>{children}</body>
    </html>
  );
}
