// context/Providers.js
import Header from "@/components/Header";
import { AuthProvider } from "./AuthContext";
import Footer from "@/components/Footer";
export default function Providers({ children }) {
  return (
    <AuthProvider>
      <Header />
      {children}
      <Footer />
    </AuthProvider>
  );
}
