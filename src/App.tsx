import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
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


const queryClient = new QueryClient();

// Wrap Routes in a Layout component to attach a key per location
const AppRoutes = () => {
  const location = useLocation();
  return (
    <Routes key={location.pathname + location.search}>
      <Route path="/" element={<Index />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/product/:id" element={<ProductDetail />} />
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
                {/* Router is already ABOVE App */}
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