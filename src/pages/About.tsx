import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Heart, Users, Leaf, Award } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import AuthModal from '@/components/AuthModal';

const values = [
  {
    icon: Heart,
    title: 'Crafted with Love',
    description: 'Every piece is made with passion and dedication by skilled artisans who have inherited their craft through generations.',
  },
  {
    icon: Users,
    title: 'Supporting Communities',
    description: 'We work directly with artisan communities across India, ensuring fair wages and sustainable livelihoods.',
  },
  {
    icon: Leaf,
    title: 'Eco-Friendly',
    description: 'Our products are made from natural materials using traditional, environmentally sustainable methods.',
  },
  {
    icon: Award,
    title: 'Quality Assured',
    description: 'Each piece undergoes careful quality checks to ensure you receive only the finest handcrafted products.',
  },
];

const About: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>About Us - Matica.life | Our Story & Mission</title>
        <meta name="description" content="Learn about Matica.life's mission to preserve and promote artisan traditions while supporting craftsmen communities across India." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header 
          onOpenCart={() => setIsCartOpen(true)} 
          onOpenAuth={() => setIsAuthOpen(true)} 
        />
        
        <main className="pt-20 md:pt-24">
          {/* Hero Section */}
          <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=1920"
              alt="Artisan at work"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-4 animate-fade-in">
                  Our Story
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  Bringing premium handcrafted artisan products to your home
                </p>
              </div>
            </div>
          </div>

          {/* Mission Section */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <p className="text-primary font-medium uppercase tracking-wide text-sm">
                    Our Mission
                  </p>
                  <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
                    Preserving Traditions, Empowering Artisans
                  </h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      Matica.life was born from a deep appreciation for India's rich artisan heritage. 
                      We believe that every handcrafted piece tells a story—of skilled hands, ancient 
                      techniques, and cultural traditions passed down through generations.
                    </p>
                    <p>
                      Our mission is simple: to bridge the gap between India's talented artisans and 
                      customers who value authentic craftsmanship. We work directly with craftsmen communities 
                      from across India, bringing their exquisite creations to your doorstep.
                    </p>
                    <p>
                      By choosing Matica.life, you're not just buying products—you're supporting a living heritage 
                      and helping sustain traditional livelihoods for generations to come.
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800"
                    alt="Traditional artisan crafts"
                    className="rounded-2xl shadow-strong"
                  />
                  <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-6 rounded-xl shadow-medium">
                    <p className="font-display text-4xl font-bold">500+</p>
                    <p className="text-primary-foreground/80">Artisan Partners</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section className="py-16 md:py-24 bg-card/50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <p className="text-primary font-medium uppercase tracking-wide text-sm mb-2">
                  What We Stand For
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
                  Our Values
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {values.map((value, index) => (
                  <div 
                    key={value.title}
                    className="bg-background p-6 rounded-xl shadow-soft text-center group animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                      <value.icon className="w-7 h-7 text-primary transition-colors group-hover:text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                      {value.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Journey Section */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <p className="text-primary font-medium uppercase tracking-wide text-sm mb-2">
                  The Journey
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-8">
                  From Artisan's Workshop to Your Home
                </h2>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { step: '01', title: 'Sourcing', desc: 'We visit artisan communities and select the finest handcrafted pieces' },
                    { step: '02', title: 'Quality Check', desc: 'Each product is carefully inspected for quality and authenticity' },
                    { step: '03', title: 'Delivery', desc: 'Safely packaged and delivered to your doorstep with care' },
                  ].map((item, index) => (
                    <div key={item.step} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                      <p className="font-display text-5xl font-bold text-primary/20 mb-4">{item.step}</p>
                      <h3 className="font-display text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
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

export default About;