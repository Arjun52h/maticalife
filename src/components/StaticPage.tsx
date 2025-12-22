import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const StaticPage: React.FC<{
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
    return (
        <div className="min-h-screen bg-background">
            <Header
                onOpenCart={() => { }}
                onOpenAuth={() => { }}
            />

            {/* Hero */}
            <section className="pt-28 pb-16 bg-gradient-to-b from-primary/10 via-background to-background">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {subtitle}
                        </p>
                    )}
                </div>
            </section>

            {/* Content */}
            <main className="pb-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div
                            className="
                bg-card
                border border-border/50
                rounded-3xl
                shadow-sm
                p-6
                sm:p-10
                md:p-12
              "
                        >
                            <div
                                className="
                  prose prose-neutral
                  prose-headings:font-display
                  prose-headings:font-semibold
                  prose-h3:text-xl
                  prose-h3:mt-8
                  prose-p:leading-relaxed
                  prose-li:leading-relaxed
                  max-w-none
                "
                            >
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default StaticPage;
