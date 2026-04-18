import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import CategoriesSection from '@/components/CategoriesSection';
import FeaturedProducts from '@/components/FeaturedProducts';
import NewArrivalsSection from '@/components/NewArrivalsSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CtaSection from '@/components/CtaSection';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import AuthModal from '@/components/AuthModal';

// --- NEW IMPORTS FOR DELHIVERY ---
// import PincodeChecker from '@/components/PincodeChecker';
// import ShipButton from '@/components/ShipButton';

const Index: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // // --- NEW STATE FOR SHIPPING LOGIC ---
  // const [isServiceable, setIsServiceable] = useState(false);
  // const [verifiedPin, setVerifiedPin] = useState("");

  // Test data for the shipment (usually comes from your checkout form)
  // const testOrder = {
  //   orderId: "MATICA-TEST-001",
  //   customerName: "Guest Buyer",
  //   address: "123 Artisan Hub, Craft City",
  //   phone: "9999999999",
  //   productName: "Handcrafted Artisan Bowl"
  // };

  return (
    <>
      <Helmet>
        <title>Matica.life - Handcrafted Artisan Products | Premiumly Better Home & Lifestyle</title>
        <meta name="description" content="Discover authentic handcrafted artisan products at Matica.life." />
      </Helmet>

      <div className="min-h-screen bg-white">
        <Header 
          onOpenCart={() => setIsCartOpen(true)} 
          onOpenAuth={() => setIsAuthOpen(true)} 
        />
        
        <main>
          <HeroSection />

          {/* --- NEW SECTION: DELHIVERY INTEGRATION DASHBOARD --- */}
          <section className="py-16 bg-slate-50 border-y border-slate-200">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Shipping Hub</h2>
                  <p className="text-slate-500">Verify delivery and manifest orders to Delhivery One</p>
                </div>

              
              </div>
            </div>
          </section>

          <FeaturesSection />
          <CategoriesSection />
          <FeaturedProducts />
          <NewArrivalsSection />
          <TestimonialsSection />
          <CtaSection />
        </main>
        
        <Footer />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    </>
  );
};

export default Index;
