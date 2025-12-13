import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SearchOverlay from "@/components/SearchOverlay";
import { useWishlist } from '@/context/WishlistContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabaseClient';


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";


interface HeaderProps {
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenCart, onOpenAuth }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { totalItems } = useCart();
  const { user, isAuthenticated, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { productIds } = useWishlist();
  const wishlistCount = productIds?.length ?? 0;

  // convert stored avatar (relative storage path or full URL) -> public url usable by <img/>
  const getPublicAvatarUrl = (avatar?: string | null): string | null => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    // assume it's a storage path relative to the 'avatars' bucket
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatar);
    return data?.publicUrl ?? null;
  };


  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  // theme toggle
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // scroll shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Categories', path: '/categories' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  // 🔍 global search = go to /shop, where all product search happens
  const handleSearchClick = () => {
    navigate('/shop');
  };

  // ❤️ wishlist → auth if not logged in, otherwise go to /wishlist (you can build that page later)
  const handleWishlistClick = () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    navigate('/wishlist');
  };

  const handleSearchSubmit = (query: string) => {
    navigate(`/shop?q=${encodeURIComponent(query)}`);
  };


  return (
    <header
      // className={cn(
      //   "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      //   isScrolled
      //     ? "bg-background/95 backdrop-blur-md shadow-soft"
      //     : "bg-transparent"
      // )}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-xl",
        isScrolled || isSearchOpen
          ? "bg-background/70 shadow-soft border-b border-border/40"
          : "bg-transparent"
      )}

    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <span className="font-display text-primary-foreground text-xl font-bold">M</span>
            </div>
            <span className="font-display text-2xl font-semibold text-foreground">
              Matica.life
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "nav-link text-sm font-medium uppercase tracking-wide",
                  location.pathname === link.path && "text-primary"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search - Desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Search className="w-5 h-5" />
            </Button>


            {/* Wishlist - Desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleWishlistClick}
              className="hidden md:flex hover:bg-primary/10 hover:text-primary transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="cart-badge">{wishlistCount}</span>
              )}
            </Button>


            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenCart}
              className="relative hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
            </Button>

            {/* User */}
            {/* User – Desktop */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hidden md:flex items-center gap-2 hover:bg-primary/10"
                  >
                    <Avatar className="w-8 h-8">
                      {getPublicAvatarUrl(user?.avatar) ? (
                        <AvatarImage src={getPublicAvatarUrl(user?.avatar) as string} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                          </span>
                        </div>
                      )}
                    </Avatar>

                    <span className="text-sm font-medium">
                      {user?.name?.split(' ')[0]}
                    </span>
                  </Button>


                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-background border-border shadow-lg"
                >
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    My Account
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => navigate('/orders')}>
                    Orders
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => navigate('/wishlist')}>
                    Wishlist
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-destructive focus:text-destructive"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenAuth}
                className="hidden md:flex hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <User className="w-5 h-5" />
              </Button>
            )}


            {/* Theme toggle – desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="hidden md:flex hover:bg-primary/10 transition-colors"
            >
              {isDarkMode ? '🌙' : '☀️'}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden hover:bg-primary/10"
            >
              {isMenuOpen ? (
                <X className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-foreground"}`} />
              ) : (
                <Menu className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-foreground"}`} />
              )}
            </Button>

          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden absolute top-full left-0 right-0 bg-background border-b border-border transform transition-all duration-300 origin-top rounded-b-2xl",
          isMenuOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
        )}
        style={{
          maxHeight: "calc(100vh - 5rem)", // 5rem = header height
          overflowY: "auto",
        }}
      >


        <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">

          {isAuthenticated && (
            <div className="flex items-center gap-3 px-4 pb-4 border-b border-border">
              <div className="w-10 h-10">
                <Avatar className="w-10 h-10">
                  {getPublicAvatarUrl(user?.avatar) ? (
                    <AvatarImage src={getPublicAvatarUrl(user?.avatar) as string} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                      </span>
                    </div>
                  )}
                </Avatar>

              </div>

              <div className="flex flex-col">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          )}


          {/* Nav Links */}
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "py-3 px-4 rounded-lg text-foreground hover:bg-primary/10 hover:text-primary transition-colors font-medium",
                location.pathname === link.path && "bg-primary/10 text-primary"
              )}
            >
              {link.name}
            </Link>
          ))}

          <div className="h-px bg-border my-2" />

          {/* Search & Theme */}
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="w-5 h-5" />
            Search products
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </Button>

          <div className="h-px bg-border my-2" />

          {/* Mobile Auth + User Menu */}
          {isAuthenticated ? (
            <>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/profile')}
                >
                  My Account
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/orders')}
                >
                  Orders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start relative"
                  onClick={() => navigate('/wishlist')}
                >
                  Wishlist
                  {wishlistCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                      {wishlistCount}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive"
                  onClick={signOut}
                >
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <Button
              onClick={onOpenAuth}
              className="w-full btn-primary"
            >
              Login / Sign Up
            </Button>
          )}
        </nav>
      </div>


      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleSearchSubmit}
      />

    </header>
  );
};

export default Header;
