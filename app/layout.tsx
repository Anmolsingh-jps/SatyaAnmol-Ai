import "./globals.css";
export const metadata = { title: "Satya AI | Anmol Singh" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
