import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Categories from "./pages/Categories";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import SmartScrollRestoration from "./components/SmartScrollRestoration";
import { AuthModalProvider } from '@/context/AuthModalContext';
import Wishlist from "./pages/Wishlist";
import WishlistProvider from "./context/WishlistContext";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import { useEffect } from "react";
import FAQ from "./pages/legal/FAQ";
import Terms from "./pages/legal/Terms";
import Cookies from "./pages/legal/Cookies";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import Returns from "./pages/legal/Returns";
import Shipping from "./pages/legal/Shipping";
import Addresses from "./pages/Addresses";

const PreventMobileKeyboard = () => {
  useEffect(() => {
    const blur = () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };

    blur();
    window.addEventListener("pageshow", blur);
    return () => window.removeEventListener("pageshow", blur);
  }, []);

  return null;
};



const queryClient = new QueryClient();

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/addresses" element={<Addresses />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/faqs" element={<FAQ />} />
      <Route path="/shipping" element={<Shipping />} />
      <Route path="/returns" element={<Returns />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/cookies" element={<Cookies />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <AuthModalProvider>
          <CartProvider>
            <WishlistProvider>
              <TooltipProvider>
                <PreventMobileKeyboard />

                <SmartScrollRestoration />

                <Toaster />
                <Sonner />

                <AppRoutes />
              </TooltipProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthModalProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;