import "./globals.css";

export const metadata = {
  title: "BuildReady — Stop wasting AI credits on bad prompts",
  description:
    "Analyze, score, and improve software build prompts before sending them to Claude, Gemini, Codex, or Cursor.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
