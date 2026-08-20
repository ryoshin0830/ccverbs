import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ccverbs — build a verb set",
  description:
    "Write the words Claude Code shows you while it works, see them animate, and open a pull request.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
