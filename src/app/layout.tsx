// @ts-ignore: allow side-effect css import without type declarations
import './globals.css';
import Providers from '@/context/Providers';
import ToastProvider from '@/provider/ToastProvider';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ReactQueryProvider from '@/provider/ReactQueryProvider';
import ChatAssistant from '@/components/ai/ChatAssistant';
import ChatWidget from '@/components/chat/ChatWidget';
import ChatHandler from '@/components/chat/ChatHandler';
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="bg-gray-100 text-gray-900">
        <div
          style={{
            fontFamily: 'var(--font-body), Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center h-full bg-white"></div>
            }
          >
            <ReactQueryProvider>
              <Providers>
                {/* <ChatAssistant/> */}
                <ChatWidget />
                <ChatHandler />
                <ToastProvider />
                <Header />
                <div className="max-w-[1700px] min-h-screen mx-auto w-full">
                  <main>{children}</main>
                </div>
              </Providers>
            </ReactQueryProvider>
          </Suspense>
          <SpeedInsights />
          <Footer />
        </div>
      </body>
    </html>
  );
}
