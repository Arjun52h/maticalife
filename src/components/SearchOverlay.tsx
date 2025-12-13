import React, { useState, useEffect } from "react";
import { X, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";


interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (query: string) => void;
}

const suggestions = [
    "Minimalist home decor",
    "Organic skincare",
    "Trending this week",
    "Eco-friendly products",
    "New arrivals",
];

const aiAutocomplete = (q: string) => {
    if (!q) return "";
    if (q.length < 2) return "";

    // Natural-language predictive output (fake but smart)
    const predictions = [
        `Looking for "${q}"? Try these top picks`,
        `${q} essentials people are loving`,
        `Popular ${q} items this month`,
        `Best rated ${q} products`,
    ];

    return predictions[Math.floor(Math.random() * predictions.length)];
};

const SearchOverlay: React.FC<SearchOverlayProps> = ({
    isOpen,
    onClose,
    onSearch,
}) => {
    const [value, setValue] = useState("");
    const [autoText, setAutoText] = useState("");

    useEffect(() => {
        if (isOpen) {
            setValue("");
            setAutoText("");
        }
    }, [isOpen]);

    useEffect(() => {
        const t = setTimeout(() => setAutoText(aiAutocomplete(value)), 120);
        return () => clearTimeout(t);
    }, [value]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSearch(value);
        onClose();
    };

    return createPortal(
        <div
            className={cn(
                "fixed inset-0 bg-background/45 backdrop-blur-2xl z-[999] flex flex-col items-center p-6 transition-all duration-300",
                isOpen
                    ? "opacity-100 pointer-events-auto translate-y-0"
                    : "opacity-0 pointer-events-none -translate-y-4"
            )}
        >
            {/* Close Button */}
            <button
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition"
                onClick={onClose}
            >
                <X className="w-6 h-6" />
            </button>

            {/* Expanding Search Input */}
            <form
                onSubmit={handleSubmit}
                className={cn(
                    "mt-24 w-full flex justify-center transition-all duration-500",
                    isOpen && "scale-105"
                )}
            >
                <div
                    className={cn(
                        "relative transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)]",
                        value
                            ? "w-[90%] md:w-[600px]"
                            : "w-[75%] md:w-[480px]"
                    )}
                >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                        autoFocus
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Search anything..."
                        className="w-full h-16 pl-12 pr-4 text-xl rounded-2xl border border-border bg-card/40 focus:ring-2 focus:ring-primary outline-none transition-all duration-300"
                    />
                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition flex items-center justify-center"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                </div>
            </form>

            {/* AI autocomplete preview */}
            {autoText && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground animate-fade-in-up">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>{autoText}</span>
                </div>
            )}

            {/* Animated Keyword Suggestions */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            onSearch(s);
                            onClose();
                        }}
                        className={cn(
                            "py-3 px-4 bg-card border border-border rounded-xl hover:bg-primary/10 hover:border-primary transition-all text-sm flex items-center justify-center",
                            "opacity-0 translate-y-4 animate-slide-up",
                            `animation-delay-${i * 100}`
                        )}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Animations */}
            <style>
                {`
          .animate-slide-up {
            animation: slideUp 0.4s forwards;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(14px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .animate-fade-in-up {
            animation: fadeUp 0.4s ease forwards;
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* stagger animation delays */
          .animation-delay-0 { animation-delay: 0ms; }
          .animation-delay-100 { animation-delay: 100ms; }
          .animation-delay-200 { animation-delay: 200ms; }
          .animation-delay-300 { animation-delay: 300ms; }
          .animation-delay-400 { animation-delay: 400ms; }
        `}
            </style>
        </div>,
        document.body
    );
};

export default SearchOverlay;
