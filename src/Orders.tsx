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
type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'requires_action' | 'refunded' | 'cod_pending';


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

type AddressSnapshot = {
    label?: string | null;
    full_name: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
};

type Order = {
    id: string;
    created_at: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    total_amount: number;
    currency: string;
    items: OrderItem[];
    shipping_address_snapshot: AddressSnapshot;
};


const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any; step: number }> = {
    pending: {
        label: 'Order Placed',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Clock,
        step: 1,
    },
    shipped: {
        label: 'Shipped',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        icon: Truck,
        step: 2,
    },
    delivered: {
        label: 'Delivered',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle2,
        step: 3,
    },
    cancelled: {
        label: 'Cancelled',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: Package,
        step: 0,
    },
};

type UIStatus =
    | { kind: 'payment'; label: string; color: string; icon: any }
    | { kind: 'fulfillment'; label: string; color: string; icon: any; step: number };


const resolvePaymentBadge = (payment_status: PaymentStatus): UIStatus => {
    switch (payment_status) {
        case 'paid':
            return { kind: 'payment', label: 'Paid', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 };
        case 'pending':
            return { kind: 'payment', label: 'Payment Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
        case 'cod_pending':
            return { kind: 'payment', label: 'Cash on Delivery', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Truck };
        case 'failed':
            return { kind: 'payment', label: 'Payment Failed', color: 'bg-red-100 text-red-800 border-red-200', icon: Package };
        case 'refunded':
            return { kind: 'payment', label: 'Refunded', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Package };
        case 'requires_action':
            return { kind: 'payment', label: 'Action Required', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock };
    }
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
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [returnType, setReturnType] = useState<'return' | 'replacement' | null>(null);
    const [returnReason, setReturnReason] = useState('');
    const [returnOrderId, setReturnOrderId] = useState<string | null>(null);

    const openReturnModal = (
        type: 'return' | 'replacement',
        orderId: string
    ) => {
        setReturnType(type);
        setReturnReason('');
        setReturnOrderId(orderId);
        setReturnModalOpen(true);
    };



    const loadRazorpay = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if ((window as any).Razorpay) {
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;

            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);

            document.body.appendChild(script);
        });
    };

    const resolveUIStatus = (order: Order): UIStatus => {
        if (order.payment_status !== 'paid') {
            return resolvePaymentBadge(order.payment_status);
        }

        return {
            kind: 'fulfillment',
            ...statusConfig[order.status],
        };
    };





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
                    .select(`
        id,
        created_at,
        status,
        payment_status,
        total_amount,
        currency,
        shipping_address_snapshot
    `)
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
                    status: r.status as OrderStatus,
                    payment_status: r.payment_status as PaymentStatus,
                    total_amount: Number(r.total_amount),
                    currency: r.currency ?? 'INR',
                    items: itemsByOrder.get(String(r.id)) ?? [],
                    shipping_address_snapshot: r.shipping_address_snapshot,
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
        const status = resolveUIStatus(selectedOrder);
        const StatusIcon = status.icon;
        const paymentBadge = resolvePaymentBadge(selectedOrder.payment_status);
        const PaymentIcon = paymentBadge.icon;

        const canRetryPayment =
            selectedOrder.payment_status === 'pending' &&
            selectedOrder.status === 'pending';

        const TOTAL_STEPS = 3;

        const canRequestReturn =
            selectedOrder.status === 'delivered' &&
            selectedOrder.payment_status === 'paid';



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
                                    {selectedOrder.payment_status === 'paid' && (
                                        <div className="mb-8">
                                            <div className="flex items-center justify-between relative">
                                                <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" />
                                                {status.kind === 'fulfillment' && (
                                                    <div
                                                        className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500"
                                                        style={{ width: `${((status.step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
                                                    />
                                                )}
                                                {['Placed', 'Shipped', 'Delivered'].map((step, i) => (
                                                    <div key={step} className="relative z-10 flex flex-col items-center">
                                                        {status.kind === 'fulfillment' && (
                                                            <div
                                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${i < status.step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                                    }`}
                                                            >
                                                                {i < status.step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                                                            </div>
                                                        )}
                                                        <span className="mt-2 text-xs text-muted-foreground">{step}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

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
                                                    <p className="font-medium">
                                                        {selectedOrder.shipping_address_snapshot.full_name}
                                                    </p>
                                                    <p className="text-sm">
                                                        {selectedOrder.shipping_address_snapshot.line1}
                                                        {selectedOrder.shipping_address_snapshot.line2 &&
                                                            `, ${selectedOrder.shipping_address_snapshot.line2}`}
                                                    </p>
                                                    <p className="text-sm">
                                                        {selectedOrder.shipping_address_snapshot.city},{" "}
                                                        {selectedOrder.shipping_address_snapshot.state} –{" "}
                                                        {selectedOrder.shipping_address_snapshot.postal_code}
                                                    </p>
                                                    <p className="text-sm">
                                                        {selectedOrder.shipping_address_snapshot.phone}
                                                    </p>
                                                </div>
                                            </div>

                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                                                <PaymentIcon className="w-5 h-5 text-primary mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Payment status</p>
                                                    <Badge variant="outline" className={paymentBadge.color}>
                                                        <PaymentIcon className="w-4 h-4 mr-2" />
                                                        {paymentBadge.label}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        {canRetryPayment && (
                                            <Button
                                                className="mt-4 w-full"
                                                onClick={async () => {
                                                    try {
                                                        const loaded = await loadRazorpay();
                                                        if (!loaded) throw new Error('Razorpay failed to load');

                                                        const session = await supabase.auth.getSession();
                                                        const token = session.data.session?.access_token;

                                                        const res = await fetch(
                                                            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`,
                                                            {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                    Authorization: `Bearer ${token}`,
                                                                },
                                                                body: JSON.stringify({ order_id: selectedOrder.id }),
                                                            }
                                                        );

                                                        if (!res.ok) throw new Error('Failed to retry payment');

                                                        const data = await res.json();

                                                        const razorpay = new (window as any).Razorpay({
                                                            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                                                            order_id: data.razorpay_order_id,
                                                            amount: data.amount,
                                                            currency: data.currency,
                                                            name: 'Matica.life',
                                                            description: 'Retry Order Payment',
                                                            handler: async () => {
                                                                // TODO: verify payment on backend
                                                                setSelectedOrderId(null);
                                                            },
                                                        });

                                                        razorpay.open();
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                }}
                                            >
                                                Retry Payment
                                            </Button>
                                        )}
                                        {canRequestReturn && (
                                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                                <Button
                                                    variant="outline"
                                                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                                    onClick={() => openReturnModal('return', selectedOrder.id)}
                                                >
                                                    Request Return
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                                                    onClick={() => openReturnModal('replacement', selectedOrder.id)}
                                                >
                                                    Request Replacement
                                                </Button>

                                            </div>
                                        )}




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

                        {(['all', 'pending', 'shipped', 'delivered', 'cancelled'] as const).map((tab) => {
                            const list = orders.filter((o) => {
                                if (tab === 'all') return true;
                                if (tab === 'cancelled') return o.status === 'cancelled';
                                return o.status === tab && o.payment_status === 'paid';
                            });

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

                                            const status = resolveUIStatus(order);

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

            {returnModalOpen && returnType && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
                    <div className="bg-background rounded-xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-xl font-semibold">
                            {returnType === 'return' ? 'Request Return' : 'Request Replacement'}
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            Please tell us why you are requesting a {returnType}.
                        </p>

                        <textarea
                            className="w-full border rounded-md p-3 text-sm"
                            rows={4}
                            placeholder="Reason (required)"
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setReturnModalOpen(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                disabled={!returnReason.trim()}
                                onClick={async () => {
                                    if (!returnOrderId || !returnType) return;

                                    try {
                                        const session = await supabase.auth.getSession();
                                        const token = session.data.session?.access_token;

                                        const res = await fetch(
                                            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/request-return`,
                                            {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({
                                                    order_id: returnOrderId,
                                                    request_type: returnType,
                                                    reason: returnReason,
                                                }),
                                            }
                                        );

                                        const text = await res.text(); // 👈 IMPORTANT

                                        if (!res.ok) {
                                            console.error('❌ Return request failed:', text);
                                            alert(text || 'Failed to submit request');
                                            return;
                                        }

                                        console.log('✅ Return request success:', text);
                                        alert('Request submitted successfully');

                                        setReturnModalOpen(false);
                                        setReturnOrderId(null);
                                        setReturnReason('');
                                        setSelectedOrderId(null);
                                    } catch (err) {
                                        console.error('🔥 Network / JS error', err);
                                        alert('Something went wrong');
                                    }
                                }}
                            >
                                Submit Request
                            </Button>
                        </div>
                    </div>
                </div>
            )}


            <Footer />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        </div>
    );
};

export default Orders;
