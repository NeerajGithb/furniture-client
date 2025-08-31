// app/layout.js
import "./globals.css";
import Providers from "@/context/Providers";
import ToastProvider from "@/components/ToastProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900">
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>
            <ToastProvider />
            <Header />
            <div className="max-w-[1700px] mx-auto w-full">
              <main>{children}</main>
            </div>
          </Providers>
        </Suspense>
        <Footer />
      </body>
    </html>
  );
}
