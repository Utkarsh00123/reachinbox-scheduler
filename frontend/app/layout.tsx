import type { Metadata } from 'next';
import { Work_Sans, Newsreader } from 'next/font/google';
import './globals.css';

const workSans = Work_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-work-sans',
  weight: ['300', '400', '500', '600', '700'],
});

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'ReachInbox | Email Campaigns & Job Scheduler',
  description: 'Editorial cold outreach and persistent email scheduler powered by BullMQ & Redis.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${workSans.variable} ${newsreader.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-surface font-body text-on-surface antialiased selection:bg-primary selection:text-white">
        {children}
      </body>
    </html>
  );
}


