import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CtaSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=1920"
          alt="Artisan Workshop"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/80 to-foreground/60" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-background mb-6">
            Experience the Magic of 
            <span className="block text-primary-foreground/90 mt-2">Artisan Craftsmanship</span>
          </h2>
          <p className="text-lg text-background/80 mb-8 leading-relaxed">
            From the artisan's workshop to your home, each piece carries centuries of tradition 
            and the warmth of skilled hands. Start your collection today and bring the 
            essence of authentic craftsmanship into your life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/shop">
              <Button className="h-14 px-8 text-lg gap-2 group bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Shop Now
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" className="h-14 px-8 text-lg border-2 border-background/30 text-background hover:bg-background/10">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;