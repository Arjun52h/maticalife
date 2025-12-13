import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden hero-gradient texture-overlay pt-16 md:pt-20">
      {/* Decorative Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[hsl(var(--primary)/0.05)] blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[hsl(var(--accent)/0.1)] blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-[hsl(var(--primary)/0.1)] blur-2xl animate-pulse-slow" />

        <svg className="absolute top-20 right-20 w-32 h-32 text-[hsl(var(--primary)/0.1)] animate-spin-slow" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" />
        </svg>

        <svg className="absolute bottom-32 left-20 w-24 h-24 text-[hsl(var(--accent)/0.2)] animate-float" viewBox="0 0 100 100">
          <ellipse cx="50" cy="50" rx="45" ry="30" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary)/0.1)] rounded-full text-[hsl(var(--primary))] text-sm font-medium animate-fade-in">
              <Sparkles className="w-4 h-4" />
              Handcrafted with Love
            </div>

            {/* Heading */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight text-[hsl(var(--foreground))] animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Discover the Art of
              <span className="block text-[hsl(var(--primary))] mt-2">Artisan Living</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl max-w-lg mx-auto lg:mx-0 text-[hsl(var(--muted-foreground))] animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Each piece tells a story of tradition, crafted by skilled artisans 
              from across India. Bring timeless elegance to your home.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link to="/shop">
                <Button className="btn-primary h-14 px-8 text-lg gap-2 group">
                  Explore Collection
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" className="h-14 px-8 text-lg border-2 border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--primary)/0.1)]">
                  Our Story
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 justify-center lg:justify-start pt-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {[
                { value: '500+', label: 'Artisans' },
                { value: '10K+', label: 'Products' },
                { value: '50K+', label: 'Happy Customers' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-3xl font-bold text-[hsl(var(--primary))]">{stat.value}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative z-10">
              <div className="aspect-square max-w-lg mx-auto relative">
                {/* Gradient overlay */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(var(--primary)/0.2)] to-[hsl(var(--accent)/0.2)] animate-pulse-slow" />

                {/* Main Image */}
                <img
                  src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800"
                  alt="Handcrafted Artisan Products"
                  className="relative z-10 w-full h-full object-cover rounded-3xl shadow-strong"
                />

                {/* Floating product cards */}
                <div className="absolute -left-8 top-1/4 bg-[hsl(var(--card))] p-3 rounded-xl shadow-medium animate-float hidden md:block">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=100"
                      alt="Vase"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-sm text-[hsl(var(--foreground))]">Terracotta Vase</p>
                      <p className="text-[hsl(var(--primary))] font-semibold">₹1,299</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-4 bottom-1/3 bg-[hsl(var(--card))] p-3 rounded-xl shadow-medium animate-float hidden md:block" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=100"
                      alt="Dinner Set"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-sm text-[hsl(var(--foreground))]">Dinner Set</p>
                      <p className="text-[hsl(var(--primary))] font-semibold">₹2,499</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-[hsl(var(--muted-foreground)/0.3)] rounded-full flex justify-center">
          <div className="w-1 h-2 bg-[hsl(var(--primary))] rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
