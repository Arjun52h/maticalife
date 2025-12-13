import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
// this will come from src/context/CartContext.tsx (we'll define it later)
import { useCart } from "../../context/CartContext";

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Shop", to: "/shop" },
    { label: "Categories", to: "/categories" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled ? "bg-white/90 backdrop-blur shadow-sm" : "bg-lightbg/95"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <span className="font-heading text-lg text-white font-semibold">
                M
              </span>
            </div>
            <span className="font-heading text-xl md:text-2xl text-accent">
              Matica.<span className="text-primary">life</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`uppercase tracking-[0.16em] ${
                  location.pathname === link.to
                    ? "text-primary"
                    : "text-darktext/70 hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative inline-flex items-center justify-center rounded-full border border-primary/20 p-2 hover:bg-primary/5 transition-colors"
              aria-label="View cart"
            >
              <ShoppingCart className="w-5 h-5 text-accent" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center px-[3px]">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden inline-flex items-center justify-center rounded-full p-2 hover:bg-primary/5"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? (
                <X className="w-5 h-5 text-accent" />
              ) : (
                <Menu className="w-5 h-5 text-accent" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-lightbg">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`py-2 ${
                  location.pathname === link.to
                    ? "text-primary font-medium"
                    : "text-darktext/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
