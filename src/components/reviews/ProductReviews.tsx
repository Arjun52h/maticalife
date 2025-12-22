import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

type Review = {
    id: number;
    rating: number;
    title?: string | null;
    body: string;
    created_at: string;
    profiles?: {
        full_name?: string | null;
        avatar?: string | null;
    }[] | null;
};


type Props = {
    productId: number;
    reviews: Review[];
    loading: boolean;
    canReview: boolean;
};

export default function ProductReviews({
    productId,
    reviews,
    loading,
    canReview,
}: Props) {
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submitReview = async () => {
        if (!body.trim()) {
            toast({ title: 'Review required', description: 'Please write your review.' });
            return;
        }

        try {
            setSubmitting(true);

            const { error } = await supabase.rpc('submit_product_review', {
                p_product_id: productId,
                p_rating: rating,
                p_title: title || null,
                p_body: body,
            });

            if (error) throw error;

            toast({ title: 'Review submitted', description: 'Thank you for your feedback.' });
            setBody('');
            setTitle('');
        } catch (err: any) {
            toast({
                title: 'Unable to submit review',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="mt-20 border-t border-border/60 py-14">
            <div className="mx-auto max-w-3xl px-4">

                {/* SECTION HEADER */}
                <div className="mb-10">
                    <h2 className="font-display text-2xl md:text-3xl text-foreground">
                        Customer Reviews
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Real feedback from verified buyers
                    </p>
                </div>

                {/* WRITE REVIEW */}
                {canReview && (
                    <div className="mb-16 bg-gradient-warm border border-border/70 rounded-3xl p-7 md:p-9 shadow-medium">

                        <h3 className="font-medium text-lg mb-1">Write a review</h3>
                        <p className="text-sm text-muted-foreground mb-5">
                            Share your experience with this piece
                        </p>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <button
                                    key={i}
                                    onClick={() => setRating(i)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-6 h-6 ${i <= rating
                                            ? 'text-amber-500 fill-amber-500'
                                            : 'text-muted-foreground/30'
                                            }`}
                                    />
                                </button>
                            ))}
                            <span className="ml-2 text-sm text-muted-foreground">
                                {rating} / 5
                            </span>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-4">
                            <Input
                                placeholder="Title (optional)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />

                            <Textarea
                                placeholder="What did you like? What stood out?"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="mt-6">
                            <Button
                                onClick={submitReview}
                                disabled={submitting}
                                className="btn-primary px-8 py-5 text-sm font-semibold">
                                Submit Review
                            </Button>
                        </div>
                    </div>
                )}

                {/* REVIEWS LIST */}
                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading reviews…</p>
                ) : reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No reviews yet. Be the first to share your thoughts.
                    </p>
                ) : (
                    <div className="space-y-8">
                        {reviews.map((r) => (
                            <div
                                key={r.id}
                                className="bg-card border border-border/60 rounded-2xl p-6 md:p-7 shadow-soft hover:shadow-medium transition"
                            >
                                {/* Rating + badge */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < r.rating
                                                    ? 'text-amber-500 fill-amber-500'
                                                    : 'text-muted-foreground/30'
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wide opacity-70">
                                        Verified Purchase
                                    </Badge>
                                </div>

                                {/* Title */}
                                {r.title && (
                                    <h4 className="font-medium text-base mb-1">
                                        {r.title}
                                    </h4>
                                )}

                                {/* Body */}
                                <p className="text-sm leading-relaxed text-foreground/80">
                                    {r.body}
                                </p>

                                {/* Footer */}
                                <div className="mt-4 text-xs text-muted-foreground">
                                    {r.profiles?.[0]?.full_name ?? 'Verified Customer'} ·{' '}
                                    {new Date(r.created_at).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );

}
