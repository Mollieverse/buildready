import "./globals.css";

export const metadata = {
  title: "BuildReady — Stop Wasting AI Credits On Bad Prompts",
  description: "Analyze, score, and improve software build prompts before sending them to AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
