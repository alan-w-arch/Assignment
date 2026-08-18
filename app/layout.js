import "./globals.css";
export const metadata = {
  title: "Resilient Job Ingestion",
  description: "Source-adapter job scraper demo",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
