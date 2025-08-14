import "./globals.css";
import Providers from "@/context/Providers";
import ToastProvider from "@/components/ToastProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">
        {/* Wrap everything inside Providers so they share context */}
        <Providers>
          <ToastProvider />
          <div className="max-w-[1640px] mx-auto w-full">
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
