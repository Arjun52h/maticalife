import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-accent text-lightbg mt-10">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand / story */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                <span className="font-heading text-lg text-white font-semibold">
                  M
                </span>
              </div>
              <span className="font-heading text-xl text-lightbg">
                Matica.<span className="text-secondary">life</span>
              </span>
            </div>
            <p className="text-sm text-lightbg/80 max-w-md">
              Handcrafted pottery from Jaipur that celebrates quiet rituals,
              small-batch making, and the beauty of imperfect forms. Each piece
              is thrown, glazed and finished by hand.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h3 className="font-heading text-sm tracking-[0.16em] uppercase">
              Shop
            </h3>
            <ul className="space-y-2 text-sm text-lightbg/80">
              <li>
                <Link to="/shop" className="hover:text-white">
                  All products
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-white">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/shop?sort=new" className="hover:text-white">
                  New arrivals
                </Link>
              </li>
              <li>
                <Link to="/shop?sort=popular" className="hover:text-white">
                  Bestsellers
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h3 className="font-heading text-sm tracking-[0.16em] uppercase">
              Studio
            </h3>
            <ul className="space-y-2 text-sm text-lightbg/80">
              <li>
                <Link to="/about" className="hover:text-white">
                  Our story
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <span>Jaipur, Rajasthan, India</span>
              </li>
              <li>
                <a
                  href="mailto:info@maticalife.com"
                  className="hover:text-white"
                >
                  info@maticalife.com
                </a>
              </li>
              <li>
                <a href="tel:+917599065015" className="hover:text-white">
                  +91 75990 65015
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-lightbg/20 mt-8 pt-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-lightbg/70">
            © {year} Matica.life. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-lightbg/70">
            <Link to="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link to="/cookies" className="hover:text-white">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
