// app/layout.js
import "./globals.css";
import Providers from "@/context/Providers";
import ToastProvider from "@/components/ToastProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900">
        <Providers>
          <ToastProvider />
          <Header />
          <div className="max-w-[1700px] mx-auto w-full">
            <main>{children}</main>
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
