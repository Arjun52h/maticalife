import {
    Facebook,
    Instagram,
    Twitter,
    Youtube,
} from 'lucide-react';

export const quickLinks = [
    { label: 'Shop All', to: '/shop' },
    { label: 'New Arrivals', to: '/shop?filter=new' },
    { label: 'Best Sellers', to: '/shop?filter=best' },
    { label: 'Categories', to: '/categories' },
    { label: 'Gift Cards', to: '/gift-cards' },
];

export const customerServiceLinks = [
    { label: 'Contact Us', to: '/contact' },
    { label: 'FAQs', to: '/faqs' },
    { label: 'Shipping Info', to: '/shipping' },
    { label: 'Returns & Exchange', to: '/returns' },
    { label: 'Track Order', to: '/orders' },
];

export const legalLinks = [
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Cookies', to: '/cookies' },
];

export const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/maticalife' },
    { icon: Instagram, href: 'https://instagram.com/maticalife' },
    { icon: Twitter, href: 'https://twitter.com/maticalife' },
    { icon: Youtube, href: 'https://youtube.com/@maticalife' },
];
