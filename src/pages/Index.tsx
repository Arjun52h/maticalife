import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import CategoriesSection from '@/components/CategoriesSection';
import FeaturedProducts from '@/components/FeaturedProducts';
import FeaturesSection from '@/components/FeaturesSection';
import NewArrivalsSection from '@/components/NewArrivalsSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CtaSection from '@/components/CtaSection';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import AuthModal from '@/components/AuthModal';

const Index: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Matica.life - Handcrafted Artisan Products | Premiumly Better Home & Lifestyle</title>
        <meta name="description" content="Discover authentic handcrafted artisan products at Matica.life. Shop premium home decor, lifestyle essentials, and traditional crafts made by skilled artisans." />
      </Helmet>

      <div className="min-h-screen">
        <Header 
          onOpenCart={() => setIsCartOpen(true)} 
          onOpenAuth={() => setIsAuthOpen(true)} 
        />
        
        <main>
          <HeroSection />
          <FeaturesSection />
          <CategoriesSection />
          <FeaturedProducts />
          <NewArrivalsSection />
          <TestimonialsSection />
          <CtaSection />
        </main>
        
        <Footer />
        
        <CartDrawer 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
        />
        
        <AuthModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
        />
      </div>
    </>
  );
};

export default Index;