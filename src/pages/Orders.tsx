// src/pages/Orders.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Package,
    Truck,
    CheckCircle2,
    Clock,
    ShoppingBag,
    ChevronRight,
    MapPin,
    Calendar,
    ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// Types matching your DB mapping + UI
type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

type OrderItem = {
    id: number;
    orderId: string;
    productId: number;
    name?: string;
    image?: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
};

type Order = {
    id: string;
    created_at: string;
    status: OrderStatus;
    payment_status?: string;
    total_amount: number;
    currency: string;
    items: OrderItem[];
    shipping_address_id?: number | null;
};

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any; step: number }> = {
    pending: {
        label: 'Order Placed',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Clock,
        step: 1,
    },
    paid: {
        label: 'Paid',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: CheckCircle2,
        step: 2,
    },
    shipped: {
        label: 'Shipped',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        icon: Truck,
        step: 3,
    },
    delivered: {
        label: 'Delivered',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle2,
        step: 4,
    },
    cancelled: {
        label: 'Cancelled',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: Package,
        step: 0,
    },
};


const Orders: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const displayOrderId = (id: string) => `ML-${id.slice(0, 8).toUpperCase()}`;

    // Format helpers
    const formatPrice = (price: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(price);

    const formatDate = (dateStr?: string) =>
        dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

    // Fetch orders + items + product metadata for current user
    useEffect(() => {
        let mounted = true;

        const fetchOrdersForUser = async () => {
            setLoading(true);
            setError(null);

            if (!user?.id) {
                setOrders([]);
                setLoading(false);
                return;
            }

            try {
                // 1) Fetch orders for user (select core fields)
                const { data: ordersData, error: ordersError } = await supabase
                    .from('orders')
                    .select('id, created_at, status, payment_status, total_amount, currency, shipping_address_id')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (ordersError) {
                    throw ordersError;
                }

                const ordersRows = (ordersData ?? []) as Array<any>;
                if (!ordersRows.length) {
                    if (mounted) {
                        setOrders([]);
                        setLoading(false);
                    }
                    return;
                }

                // Collect order IDs
                const orderIds = ordersRows.map((r) => String(r.id));

                // 2) Fetch order_items for these orders
                const { data: itemsData, error: itemsError } = await supabase
                    .from('order_items')
                    .select('id, order_id, product_id, quantity, unit_price, subtotal')
                    .in('order_id', orderIds);

                if (itemsError) {
                    throw itemsError;
                }

                const itemsRows = (itemsData ?? []) as Array<any>;
                const productIds = Array.from(new Set(itemsRows.map((it) => Number(it.product_id)).filter(Boolean)));

                // 3) Fetch product metadata (name, image) for those product ids
                let productsById = new Map<number, { name?: string; image?: string }>();
                if (productIds.length) {
                    const { data: productsData, error: productsError } = await supabase
                        .from('products')
                        .select('id, name, image')
                        .in('id', productIds);

                    if (productsError) {
                        // don't fatal — proceed with missing names/images
                        console.debug('products fetch error', productsError);
                    } else {
                        (productsData ?? []).forEach((p: any) => {
                            productsById.set(Number(p.id), { name: p.name, image: p.image });
                        });
                    }
                }

                // 4) Assemble items keyed by order_id
                const itemsByOrder = new Map<string, OrderItem[]>();
                itemsRows.forEach((it) => {
                    const oid = String(it.order_id);
                    const pid = Number(it.product_id);
                    const mapped: OrderItem = {
                        id: Number(it.id),
                        orderId: oid,
                        productId: pid,
                        name: productsById.get(pid)?.name ?? undefined,
                        image: productsById.get(pid)?.image ?? undefined,
                        quantity: Number(it.quantity),
                        unit_price: Number(it.unit_price),
                        subtotal: Number(it.subtotal),
                    };
                    const arr = itemsByOrder.get(oid) ?? [];
                    arr.push(mapped);
                    itemsByOrder.set(oid, arr);
                });

                // 5) Build final orders list
                const finalOrders: Order[] = ordersRows.map((r) => ({
                    id: String(r.id),
                    created_at: r.created_at,
                    status: r.status,
                    payment_status: r.payment_status,
                    total_amount: Number(r.total_amount),
                    currency: r.currency ?? 'INR',
                    items: itemsByOrder.get(String(r.id)) ?? [],
                    shipping_address_id: r.shipping_address_id ?? null,
                }));

                if (!mounted) return;
                setOrders(finalOrders);
            } catch (err: any) {
                console.error('Failed to fetch orders', err);
                if (mounted) setError(err?.message ?? 'Failed to load orders');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchOrdersForUser();

        return () => {
            mounted = false;
        };
    }, [user?.id]);

    // Selected order object
    const selectedOrder = useMemo(() => orders.find((o) => o.id === selectedOrderId) ?? null, [orders, selectedOrderId]);

    // UI: if not signed in
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background">
                <Helmet>
                    <title>My Orders | Matica.life</title>
                </Helmet>
                <Header onOpenCart={() => setIsCartOpen(true)} onOpenAuth={() => setIsAuthOpen(true)} />
                <main className="pt-24 pb-16 px-4">
                    <div className="max-w-md mx-auto text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Package className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-3">Sign in to view your orders</h1>
                        <p className="text-muted-foreground mb-8">Track your orders and view order history</p>
                        <Button onClick={() => setIsAuthOpen(true)} size="lg" className="px-8">
                            Sign In
                        </Button>
                    </div>
                </main>
                <Footer />
                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
                <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
            </div>
        );
    }

    // If a specific order is selected show details
    if (selectedOrder) {
        const status = statusConfig[selectedOrder.status] ?? statusConfig['pending'];
        const StatusIcon = status.icon;

        return (
            <div className="min-h-screen bg-background">
                <Helmet>
                    <title>Order {selectedOrder.id} | Matica.life</title>
                </Helmet>

                <Header onOpenCart={() => setIsCartOpen(true)} onOpenAuth={() => setIsAuthOpen(true)} />

                <main className="pt-24 pb-16">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <Button variant="ghost" className="mb-6 -ml-2" onClick={() => setSelectedOrderId(null)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Orders
                        </Button>

                        <div className="space-y-6">
                            <Card className="border-border/50 overflow-hidden">
                                <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                                            <h1 className="text-xl font-bold">{displayOrderId(selectedOrder.id)}</h1>
                                        </div>
                                        <Badge variant="outline" className={`${status.color} px-4 py-2`}>
                                            <StatusIcon className="w-4 h-4 mr-2" />
                                            {status.label}
                                        </Badge>
                                    </div>
                                </div>

                                <CardContent className="p-6">
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between relative">
                                            <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" />
                                            <div
                                                className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500"
                                                style={{ width: `${((status.step - 1) / 3) * 100}%` }}

                                            />
                                            {['Placed', 'Paid', 'Shipped', 'Delivered'].map((step, i) => (
                                                <div key={step} className="relative z-10 flex flex-col items-center">
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${i < status.step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                            }`}
                                                    >
                                                        {i < status.step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                                                    </div>
                                                    <span className="mt-2 text-xs text-muted-foreground">{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                                                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Ordered on</p>
                                                    <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                                                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Shipping Address</p>
                                                    <p className="font-medium">{selectedOrder.shipping_address_id ? `Address #${selectedOrder.shipping_address_id}` : 'Not set'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                                                <Truck className="w-5 h-5 text-primary mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Payment status</p>
                                                    <p className="font-medium capitalize">
                                                        {selectedOrder.payment_status === 'paid' ? 'Paid' : selectedOrder.payment_status}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/50">
                                <CardContent className="p-6">
                                    <h2 className="text-lg font-semibold mb-4">Order Items</h2>

                                    <div className="space-y-4">
                                        {selectedOrder.items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted" />}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-foreground truncate">{item.name ?? `Product #${item.productId}`}</h3>
                                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="font-semibold text-foreground">{formatPrice(item.unit_price)}</p>
                                                    <p className="text-sm text-muted-foreground">Subtotal: {formatPrice(item.subtotal)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-border/50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-semibold">Total</span>
                                            <span className="text-xl font-bold text-primary">{formatPrice(selectedOrder.total_amount)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>

                <Footer />
                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
                <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
            </div>
        );
    }

    // List view
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>My Orders | Matica.life</title>
                <meta name="description" content="View and track your Matica.life orders." />
            </Helmet>

            <Header onOpenCart={() => setIsCartOpen(true)} onOpenAuth={() => setIsAuthOpen(true)} />

            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">My Orders</h1>
                        <p className="text-muted-foreground">Track and manage your orders</p>
                    </div>

                    <Tabs defaultValue="all" className="space-y-6">
                        <TabsList className="bg-muted/50 p-1">
                            <TabsTrigger value="all" className="data-[state=active]:bg-background">All Orders</TabsTrigger>
                            <TabsTrigger value="pending" className="data-[state=active]:bg-background">Pending</TabsTrigger>
                            <TabsTrigger value="shipped" className="data-[state=active]:bg-background">Shipped</TabsTrigger>
                            <TabsTrigger value="delivered" className="data-[state=active]:bg-background">Delivered</TabsTrigger>
                            <TabsTrigger value="cancelled" className="data-[state=active]:bg-background">Cancelled</TabsTrigger>
                        </TabsList>

                        {(['all', 'pending', 'shipped', 'delivered'] as const).map((tab) => {
                            const list = orders.filter((o) => tab === 'all' || o.status === tab);
                            return (
                                <TabsContent key={tab} value={tab} className="space-y-4">
                                    {loading ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <div key={i} className="animate-pulse rounded-2xl bg-background/30 h-36 p-4" />
                                            ))}
                                        </div>
                                    ) : error ? (
                                        <div className="text-center py-12 text-destructive">{error}</div>
                                    ) : list.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                                                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-lg font-medium text-foreground mb-2">No orders found</h3>
                                            <p className="text-muted-foreground mb-6">
                                                {tab === 'all' ? "You haven't placed any orders yet" : `No ${tab} orders at the moment`}
                                            </p>
                                            <Button onClick={() => navigate('/shop')}>Start Shopping</Button>
                                        </div>
                                    ) : (
                                        list.map((order) => {
                                            const status = statusConfig[order.status] ?? statusConfig['pending'];
                                            const StatusIcon = status.icon;
                                            return (
                                                <Card key={order.id} className="border-border/50 hover:border-primary/30 transition-all cursor-pointer group" onClick={() => setSelectedOrderId(order.id)}>
                                                    <CardContent className="p-6">
                                                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                                            <div className="flex -space-x-3">
                                                                {order.items.slice(0, 3).map((it, i) => (
                                                                    <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border-2 border-background shadow-sm">
                                                                        {it.image ? <img src={it.image} alt={it.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted" />}
                                                                    </div>
                                                                ))}
                                                                {order.items.length > 3 && <div className="w-14 h-14 rounded-lg bg-muted border-2 border-background flex items-center justify-center text-sm font-medium text-muted-foreground">+{order.items.length - 3}</div>}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
                                                                    <h3 className="font-semibold">{displayOrderId(order.id)}</h3>
                                                                    <Badge variant="outline" className={`${status.color}`}>
                                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                                        {status.label}
                                                                    </Badge>
                                                                </div>

                                                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                                                    <span>{formatDate(order.created_at)}</span>
                                                                    <span>{order.items.reduce((s, it) => s + it.quantity, 0)} items</span>
                                                                    <span className="font-medium text-foreground">{formatPrice(order.total_amount)}</span>
                                                                </div>
                                                            </div>

                                                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })
                                    )}
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                </div>
            </main>

            <Footer />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        </div>
    );
};

export default Orders;
