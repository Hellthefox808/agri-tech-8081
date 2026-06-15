import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import ParticleBg from '@/components/ParticleBg';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata = {
  title: 'AgriGuard — AIoT Agri-Health Guardian | Smart Produce Traceability',
  description: 'Precision Food Safety & Smart Produce Traceability with Geo-Aware Edge Intelligence. Real-time monitoring, AI grading, blockchain traceability, and geospatial farm analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background text-slate-100 min-h-screen relative font-sans antialiased overflow-x-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-[#0B101E] z-[-2]" />
        <ParticleBg />
        {children}
      </body>
    </html>
  );
}
