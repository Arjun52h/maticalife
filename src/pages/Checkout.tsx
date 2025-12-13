import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CreditCard,
    Truck,
    Shield,
    Gift,
    Tag,
    MapPin,
    Phone,
    Mail,
    User,
    Check,
    ChevronRight,
    Sparkles,
    Package,
    Clock
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import AuthModal from '@/components/AuthModal';
import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";


const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const { items, totalPrice, clearCart } = useCart();
    const { isAuthenticated, user } = useAuth();

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);

    const [promoCode, setPromoCode] = useState('');
    const [promoApplied, setPromoApplied] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [orderId, setOrderId] = useState<string | null>(null);


    const [paymentMethod, setPaymentMethod] = useState('card');

    const [formData, setFormData] = useState({
        firstName: user?.name?.split(' ')[0] || '',
        lastName: user?.name?.split(' ').slice(1).join(' ') || '',
        email: user?.email || '',
        phone: '',
        address: '',
        apartment: '',
        city: '',
        state: '',
        pincode: '',
        saveAddress: true
    });

    const shipping = totalPrice > 999 ? 0 : 99;
    const tax = Math.round(totalPrice * 0.05);
    const finalTotal = totalPrice + shipping + tax - discount;

    const handleApplyPromo = () => {
        if (promoCode.toUpperCase() === 'MATICA10') {
            const promoDiscount = Math.round(totalPrice * 0.1);
            setDiscount(promoDiscount);
            setPromoApplied(true);
            toast({
                title: "Promo Applied!",
                description: `You saved ₹${promoDiscount.toLocaleString('en-IN')}`,
            });
        } else if (promoCode.toUpperCase() === 'WELCOME') {
            const promoDiscount = 100;
            setDiscount(promoDiscount);
            setPromoApplied(true);
            toast({
                title: "Welcome Discount Applied!",
                description: "₹100 off on your first order",
            });
        } else {
            toast({
                title: "Invalid Code",
                description: "This promo code doesn't exist",
                variant: "destructive"
            });
        }
    };

    const handlePlaceOrder = async () => {
        if (!user?.id) {
            toast({
                title: "Login required",
                description: "Please sign in to place an order",
                variant: "destructive",
            });
            return;
        }

        if (items.length === 0) {
            toast({ title: "Cart is empty", variant: "destructive" });
            return;
        }

        setIsProcessing(true);

        try {
            // 1️⃣ Address
            let shippingAddressId: number;

            const { data: existingAddress, error: addrSelectError } = await supabase
                .from("addresses")
                .select("id")
                .eq("user_id", user.id)
                .eq("is_default", true)
                .maybeSingle();

            if (addrSelectError) throw addrSelectError;

            const addressPayload = {
                user_id: user.id,
                label: "Home",
                full_name: `${formData.firstName} ${formData.lastName}`,
                phone: formData.phone,
                line1: formData.address,
                line2: formData.apartment || null,
                city: formData.city,
                state: formData.state,
                postal_code: formData.pincode,
                country: "India",
                is_default: true,
                updated_at: new Date().toISOString(),
            };

            if (existingAddress?.id) {
                const { error } = await supabase
                    .from("addresses")
                    .update(addressPayload)
                    .eq("id", existingAddress.id);

                if (error) throw error;
                shippingAddressId = existingAddress.id;
            } else {
                const { data, error } = await supabase
                    .from("addresses")
                    .insert([{ ...addressPayload, created_at: new Date().toISOString() }])
                    .select("id")
                    .single();

                if (error) throw error;
                shippingAddressId = data.id;
            }

            const payload = items.map(item => ({
                product_id: item.productId,
                quantity: item.quantity,
            }));

            const { data: orderId, error } = await supabase.rpc(
                'create_order_with_validation',
                {
                    p_user_id: user.id,
                    p_items: payload,
                    p_shipping_address_id: shippingAddressId,
                    p_payment_method: paymentMethod,
                }
            );

            if (error) throw error;

            setOrderId(orderId);
            clearCart();
            setOrderPlaced(true);


        } catch (err) {
            console.error(err);
            toast({
                title: "Order failed",
                description: "Something went wrong while placing your order",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };


    const steps = [
        { id: 1, name: 'Shipping', icon: Truck },
        { id: 2, name: 'Payment', icon: CreditCard },
        { id: 3, name: 'Confirm', icon: Check }
    ];

    useEffect(() => {
        const loadDefaultAddress = async () => {
            if (!user?.id) return;

            const { data, error } = await supabase
                .from("addresses")
                .select("*")
                .eq("user_id", user.id)
                .eq("is_default", true)
                .maybeSingle();

            if (data) {
                setFormData((prev) => ({
                    ...prev,
                    firstName: data.full_name?.split(" ")[0] || "",
                    lastName: data.full_name?.split(" ").slice(1).join(" "),
                    phone: data.phone || "",
                    address: data.line1 || "",
                    city: data.city || "",
                    state: data.state || "",
                    pincode: data.postal_code || "",
                }));
            }
        };

        loadDefaultAddress();
    }, [user?.id]);


    if (items.length === 0 && !orderPlaced) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header onOpenCart={() => setIsCartOpen(true)} onOpenAuth={() => setIsAuthOpen(true)} />

                <main className="flex-1 flex items-center justify-center px-4 pt-10 bg-gradient-to-b from-background to-muted/40">


                    <div className="w-full max-w-md min-h-[85vh] flex flex-col justify-center text-center animate-fade-in">
                        <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                            <Package className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h1 className="font-display text-4xl font-semibold mb-4">Your cart is empty</h1>
                        <p className="text-muted-foreground mb-8">Add some beautiful products to checkout</p>
                        <Button onClick={() => navigate('/shop')} className="btn-primary">
                            Browse Products
                        </Button>
                        <div className="mt-10 grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div>Handcrafted</div>
                            <div>Secure Checkout</div>
                            <div>Fast Delivery</div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        );
    }


    if (orderPlaced) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header onOpenCart={() => setIsCartOpen(true)} onOpenAuth={() => setIsAuthOpen(true)} />

                <main className="flex-1 flex items-center justify-center px-4 py-28 bg-gradient-to-b from-primary/5 via-background to-background">

                    <div className="text-center max-w-lg animate-fade-in">
                        <div className="relative w-32 h-32 mx-auto mb-8">
                            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                            <div className="relative w-full h-full rounded-full bg-gradient-terracotta flex items-center justify-center shadow-glow">
                                <Check className="w-16 h-16 text-primary-foreground" />
                            </div>
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            Order Confirmed
                        </div>
                        <h1 className="font-display text-5xl font-bold mb-4">Thank you for your order!</h1>
                        <p className="text-muted-foreground text-lg mb-4">
                            Order #ML{Date.now().toString().slice(-8)}
                        </p>
                        <p className="text-muted-foreground mb-8">
                            We've sent a confirmation email to {formData.email || user?.email}
                        </p>
                        <div className="bg-card rounded-2xl p-6 mb-8 shadow-soft">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    <span>Estimated Delivery</span>
                                </div>
                                <span className="font-semibold">3-5 Business Days</span>
                            </div>
                        </div>

                        <div className="my-6 text-sm text-muted-foreground">
                            You can track your order status anytime from your account.
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button onClick={() => navigate('/orders')} variant="outline" className="gap-2">
                                <Package className="w-4 h-4" />
                                Track Order
                            </Button>
                            <Button onClick={() => navigate('/shop')} className="btn-primary">
                                Continue Shopping
                            </Button>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header onOpenCart={() => setIsCartOpen(true)} onOpenAuth={() => setIsAuthOpen(true)} />

            <main className="flex-1 py-8">
                <div className="container mx-auto px-4">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Shopping
                    </Button>

                    {/* Progress Steps */}
                    <div className="mb-10">
                        <div className="flex items-center justify-center gap-2 sm:gap-4">
                            {steps.map((step, index) => (
                                <React.Fragment key={step.id}>
                                    <button
                                        onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                                        className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 rounded-full transition-all duration-300 ${step.id === currentStep
                                            ? 'bg-primary text-primary-foreground shadow-glow'
                                            : step.id < currentStep
                                                ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30'
                                                : 'bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        <step.icon className="w-5 h-5" />
                                        <span className="font-medium hidden sm:inline">{step.name}</span>
                                    </button>
                                    {index < steps.length - 1 && (
                                        <ChevronRight className={`w-5 h-5 ${step.id < currentStep ? 'text-primary' : 'text-muted-foreground'}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Step 1: Shipping */}
                            {currentStep === 1 && (
                                <div className="animate-fade-in">
                                    <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-soft">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Truck className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h2 className="font-display text-2xl font-semibold">Shipping Details</h2>
                                                <p className="text-sm text-muted-foreground">Where should we deliver your order?</p>
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName" className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    First Name
                                                </Label>
                                                <Input
                                                    id="firstName"
                                                    value={formData.firstName}
                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                    placeholder="John"
                                                    className="h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Last Name</Label>
                                                <Input
                                                    id="lastName"
                                                    value={formData.lastName}
                                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                    placeholder="Doe"
                                                    className="h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                                    Email
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    placeholder="john@example.com"
                                                    className="h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                                    Phone
                                                </Label>
                                                <Input
                                                    id="phone"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    placeholder="+91 98765 43210"
                                                    className="h-12"
                                                />
                                            </div>
                                            <div className="sm:col-span-2 space-y-2">
                                                <Label htmlFor="address" className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                                    Address
                                                </Label>
                                                <Input
                                                    id="address"
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    placeholder="123 Main Street"
                                                    className="h-12"
                                                />
                                            </div>
                                            <div className="sm:col-span-2 space-y-2">
                                                <Label htmlFor="apartment">Apartment, suite, etc. (optional)</Label>
                                                <Input
                                                    id="apartment"
                                                    value={formData.apartment}
                                                    onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                                                    placeholder="Apt 4B"
                                                    className="h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="city">City</Label>
                                                <Input
                                                    id="city"
                                                    value={formData.city}
                                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                    placeholder="Mumbai"
                                                    className="h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="state">State</Label>
                                                <Input
                                                    id="state"
                                                    value={formData.state}
                                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                    placeholder="Maharashtra"
                                                    className="h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pincode">PIN Code</Label>
                                                <Input
                                                    id="pincode"
                                                    value={formData.pincode}
                                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                                    placeholder="400001"
                                                    className="h-12"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-border">
                                            <Button
                                                onClick={() => setCurrentStep(2)}
                                                className="w-full btn-primary h-12 text-lg gap-2"
                                            >
                                                Continue to Payment
                                                <ChevronRight className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Payment */}
                            {currentStep === 2 && (
                                <div className="animate-fade-in">
                                    <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-soft">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <CreditCard className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h2 className="font-display text-2xl font-semibold">Payment Method</h2>
                                                <p className="text-sm text-muted-foreground">Choose how you'd like to pay</p>
                                            </div>
                                        </div>

                                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                                            <label
                                                htmlFor="card"
                                                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'card'
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/50'
                                                    }`}
                                            >
                                                <RadioGroupItem value="card" id="card" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <CreditCard className="w-5 h-5 text-primary" />
                                                        <span className="font-medium">Credit / Debit Card</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">Visa, Mastercard, RuPay</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="w-10 h-6 bg-muted rounded flex items-center justify-center text-xs font-bold">VISA</div>
                                                    <div className="w-10 h-6 bg-muted rounded flex items-center justify-center text-xs font-bold">MC</div>
                                                </div>
                                            </label>

                                            <label
                                                htmlFor="upi"
                                                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'upi'
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/50'
                                                    }`}
                                            >
                                                <RadioGroupItem value="upi" id="upi" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-5 h-5 bg-primary rounded-sm flex items-center justify-center text-primary-foreground text-xs font-bold">U</div>
                                                        <span className="font-medium">UPI Payment</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">GPay, PhonePe, Paytm</p>
                                                </div>
                                            </label>

                                            <label
                                                htmlFor="netbanking"
                                                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'netbanking'
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/50'
                                                    }`}
                                            >
                                                <RadioGroupItem value="netbanking" id="netbanking" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <Shield className="w-5 h-5 text-primary" />
                                                        <span className="font-medium">Net Banking</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">All major banks supported</p>
                                                </div>
                                            </label>

                                            <label
                                                htmlFor="cod"
                                                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'cod'
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/50'
                                                    }`}
                                            >
                                                <RadioGroupItem value="cod" id="cod" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <Package className="w-5 h-5 text-primary" />
                                                        <span className="font-medium">Cash on Delivery</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">Pay when you receive</p>
                                                </div>
                                            </label>
                                        </RadioGroup>

                                        {paymentMethod === 'card' && (
                                            <div className="mt-6 pt-6 border-t border-border space-y-4 animate-fade-in">
                                                <div className="space-y-2">
                                                    <Label>Card Number</Label>
                                                    <Input placeholder="1234 5678 9012 3456" className="h-12" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Expiry Date</Label>
                                                        <Input placeholder="MM/YY" className="h-12" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>CVV</Label>
                                                        <Input placeholder="123" type="password" className="h-12" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Name on Card</Label>
                                                    <Input placeholder="John Doe" className="h-12" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-6 pt-6 border-t border-border flex gap-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => setCurrentStep(1)}
                                                className="flex-1 h-12"
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                onClick={() => setCurrentStep(3)}
                                                className="flex-1 btn-primary h-12 gap-2"
                                            >
                                                Review Order
                                                <ChevronRight className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Confirm */}
                            {currentStep === 3 && (
                                <div className="animate-fade-in space-y-6">
                                    {/* Shipping Summary */}
                                    <div className="bg-card rounded-2xl p-6 shadow-soft">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <Truck className="w-5 h-5 text-primary" />
                                                <h3 className="font-display text-lg font-semibold">Shipping To</h3>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                                                Edit
                                            </Button>
                                        </div>
                                        <div className="text-muted-foreground">
                                            <p className="font-medium text-foreground">{formData.firstName} {formData.lastName}</p>
                                            <p>{formData.address}{formData.apartment && `, ${formData.apartment}`}</p>
                                            <p>{formData.city}, {formData.state} - {formData.pincode}</p>
                                            <p>{formData.phone}</p>
                                        </div>
                                    </div>

                                    {/* Payment Summary */}
                                    <div className="bg-card rounded-2xl p-6 shadow-soft">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <CreditCard className="w-5 h-5 text-primary" />
                                                <h3 className="font-display text-lg font-semibold">Payment Method</h3>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                                                Edit
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {paymentMethod === 'card' && <CreditCard className="w-5 h-5" />}
                                            {paymentMethod === 'upi' && <div className="w-5 h-5 bg-primary rounded-sm flex items-center justify-center text-primary-foreground text-xs font-bold">U</div>}
                                            {paymentMethod === 'netbanking' && <Shield className="w-5 h-5" />}
                                            {paymentMethod === 'cod' && <Package className="w-5 h-5" />}
                                            <span className="capitalize">{paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'upi' ? 'UPI Payment' : paymentMethod === 'netbanking' ? 'Net Banking' : 'Credit/Debit Card'}</span>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="bg-card rounded-2xl p-6 shadow-soft">
                                        <h3 className="font-display text-lg font-semibold mb-4">Order Items</h3>
                                        <div className="space-y-4">
                                            {items.map((item) => (
                                                <div key={item.productId} className="flex gap-4">
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium line-clamp-1">{item.title}</h4>
                                                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                    </div>
                                                    <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Place Order Button */}
                                    <Button
                                        onClick={handlePlaceOrder}
                                        disabled={isProcessing}
                                        className="w-full btn-primary h-14 text-lg gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Place Order - ₹{finalTotal.toLocaleString('en-IN')}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-card rounded-2xl p-6 shadow-soft sticky top-24 space-y-6">
                                <h3 className="font-display text-xl font-semibold">Order Summary</h3>

                                {/* Items Preview */}
                                <div className="space-y-3 max-h-48 overflow-y-auto">
                                    {items.map((item) => (
                                        <div key={item.productId} className="flex gap-3">
                                            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center justify-center">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                                                <p className="text-sm text-muted-foreground">₹{item.price.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator />

                                {/* Promo Code */}
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-primary" />
                                        Promo Code
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter code"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                            disabled={promoApplied}
                                            className="h-10"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={handleApplyPromo}
                                            disabled={promoApplied || !promoCode}
                                            className="shrink-0"
                                        >
                                            {promoApplied ? <Check className="w-4 h-4" /> : 'Apply'}
                                        </Button>
                                    </div>
                                    {promoApplied && (
                                        <p className="text-sm text-primary flex items-center gap-2">
                                            <Gift className="w-4 h-4" />
                                            Code "{promoCode.toUpperCase()}" applied!
                                        </p>
                                    )}
                                </div>

                                <Separator />

                                {/* Price Breakdown */}
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium">₹{totalPrice.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span className="font-medium">
                                            {shipping === 0 ? (
                                                <span className="text-primary">Free</span>
                                            ) : (
                                                `₹${shipping}`
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tax (5%)</span>
                                        <span className="font-medium">₹{tax.toLocaleString('en-IN')}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-primary">
                                            <span>Discount</span>
                                            <span className="font-medium">-₹{discount.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div className="flex justify-between items-center">
                                    <span className="font-display text-lg font-semibold">Total</span>
                                    <span className="font-display text-2xl font-bold text-primary">
                                        ₹{finalTotal.toLocaleString('en-IN')}
                                    </span>
                                </div>

                                {/* Trust Badges */}
                                <div className="grid grid-cols-3 gap-2 pt-4">
                                    <div className="flex flex-col items-center text-center p-3 bg-muted/50 rounded-xl">
                                        <Shield className="w-5 h-5 text-primary mb-1" />
                                        <span className="text-xs text-muted-foreground">Secure Payment</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center p-3 bg-muted/50 rounded-xl">
                                        <Truck className="w-5 h-5 text-primary mb-1" />
                                        <span className="text-xs text-muted-foreground">Fast Delivery</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center p-3 bg-muted/50 rounded-xl">
                                        <Gift className="w-5 h-5 text-primary mb-1" />
                                        <span className="text-xs text-muted-foreground">Easy Returns</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        </div>
    );
};

export default Checkout;
