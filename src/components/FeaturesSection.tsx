import React from 'react';
import { Truck, Shield, Leaf, HeartHandshake } from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'Free delivery on orders above ₹999 across India',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: '100% secure payment with multiple options',
  },
  {
    icon: Leaf,
    title: 'Eco-Friendly',
    description: 'All products are sustainable and earth-friendly',
  },
  {
    icon: HeartHandshake,
    title: 'Support Artisans',
    description: 'Every purchase supports local Indian artisans',
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-12 md:py-16 bg-primary/5 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="flex flex-col items-center text-center group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-primary transition-colors group-hover:text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg md:text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
