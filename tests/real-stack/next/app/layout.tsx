// The README's CSS, once, at the top of the app: in Next.js, the root layout.
import "@jaatster/blip-font/font.css";
import "@jaatster/blip-tokens/tokens.css";
import "@jaatster/blip-core/core.css";
import "@jaatster/blip-components/components.css";

export const metadata = { title: "Blip on Next.js" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
