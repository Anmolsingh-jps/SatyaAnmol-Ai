export const metadata = {
  title: "Satya AI",
  description: "Truth Engine",
};

export default function RootLayout({ children }: any) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0a0a", color: "#fff" }}>
        {children}
      </body>
    </html>
  );
}