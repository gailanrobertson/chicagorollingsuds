import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rolling Suds of Schaumburg - Rosemont | Professional Power Washing',
  description: 'Expert residential power washing in Schaumburg and Rosemont. House washing, window cleaning, roof wash, and more. Get your free quote today.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
