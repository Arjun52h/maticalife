
import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Props {
    productId: number | string;
    size?: 'sm' | 'md';
    onAuthRequired?: () => void;
    onClick?: (e: React.MouseEvent) => void;
    className?: string; // <-- new, optional className forwarded to Button
}

const WishlistButton: React.FC<Props> = ({ productId, size = 'md', onAuthRequired, onClick, className }) => {
    const { isInWishlist, toggle, mutating } = useWishlist();
    const { user } = useAuth();
    const [busy, setBusy] = useState(false);

    const pid = typeof productId === 'string' ? Number(productId) : productId;
    const productIdIsNumeric = typeof pid === 'number' && !Number.isNaN(pid);
    const inList = productIdIsNumeric ? isInWishlist(pid) : false;

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) onClick(e);

        if (!productIdIsNumeric) {
            console.warn('[WishlistButton] productId is not numeric', productId);
            toast({ title: 'Cannot add to wishlist', description: 'Product id is in an unsupported format.' });
            return;
        }

        if (!user) {
            if (onAuthRequired) {
                onAuthRequired();
                return;
            }
            toast({ title: 'Sign in required', description: 'Please sign in to save wishlist items.' });
            return;
        }

        try {
            setBusy(true);
            await toggle(pid);
            toast({ title: inList ? 'Removed from wishlist' : 'Added to wishlist' });
        } catch (err: any) {
            console.error('[WishlistButton] toggle failed', err);
            toast({ title: 'Wishlist failed', description: (err?.message || String(err)) });
        } finally {
            setBusy(false);
        }
    };

    const baseStyles = `
    rounded-full
    bg-background/90 backdrop-blur-sm shadow-md
    hover:bg-primary hover:text-primary-foreground
    transition-all duration-300
    flex items-center justify-center
`;

    const sizeStyles = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';


    return (
        <Button
            size="icon"
            variant="secondary"
            className={`${baseStyles} ${sizeStyles} p-0 ${className ?? ''}`}
            onClick={handleClick}
            aria-pressed={inList}
            disabled={mutating || busy}
        >
            <Heart className={`w-4 h-4 ${inList ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
        </Button>

    );
};

export default WishlistButton;
