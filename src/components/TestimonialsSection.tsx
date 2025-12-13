import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const testimonials = [
  {
    id: 1,
    name: 'Ananya Gupta',
    location: 'Mumbai',
    avatar: 'A',
    rating: 5,
    text: "The terracotta vase I ordered exceeded my expectations! The craftsmanship is exquisite, and it's become the centerpiece of my living room. Love supporting Indian artisans!",
  },
  {
    id: 2,
    name: 'Rajesh Kumar',
    location: 'Delhi',
    avatar: 'R',
    rating: 5,
    text: "Bought the ceramic dinner set for my anniversary. My wife absolutely loves it! The traditional designs with modern elegance - exactly what we were looking for.",
  },
  {
    id: 3,
    name: 'Priya Patel',
    location: 'Bangalore',
    avatar: 'P',
    rating: 5,
    text: "The collection is stunning. Fast delivery and excellent packaging. Each piece feels like owning a piece of Indian heritage.",
  },
  {
    id: 4,
    name: 'Vikram Singh',
    location: 'Jaipur',
    avatar: 'V',
    rating: 5,
    text: "As someone who appreciates authentic Indian crafts, Matica.life is a treasure. The quality and authenticity of their products is unmatched.",
  },
];

const TestimonialsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">
            Testimonials
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground">
            What Our Customers Say
          </h2>
        </div>

        {/* Testimonials Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Quote Icon */}
            <Quote className="absolute -top-4 left-4 md:left-8 w-12 h-12 text-primary/20" />
            
            {/* Testimonial Cards */}
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {testimonials.map((testimonial) => (
                  <div 
                    key={testimonial.id}
                    className="w-full flex-shrink-0 px-4"
                  >
                    <div className="bg-card rounded-2xl p-8 md:p-12 shadow-soft">
                      {/* Rating */}
                      <div className="flex gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i}
                            className={cn(
                              "w-5 h-5",
                              i < testimonial.rating 
                                ? "text-amber-500 fill-amber-500" 
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                      
                      {/* Text */}
                      <p className="text-lg md:text-xl text-foreground leading-relaxed mb-8">
                        "{testimonial.text}"
                      </p>
                      
                      {/* Author */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="font-display text-xl font-semibold text-primary">
                            {testimonial.avatar}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {testimonial.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={prev}
                className="rounded-full border-primary/30 hover:bg-primary hover:text-primary-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              {/* Dots */}
              <div className="flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      i === currentIndex 
                        ? "w-8 bg-primary" 
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={next}
                className="rounded-full border-primary/30 hover:bg-primary hover:text-primary-foreground"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;