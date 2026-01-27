import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CreditCard,
    Truck,
    Shield,
    Gift,
    Tag,
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
    type Address = {
        id: number;
        label: string;
        full_name: string;
        phone: string;
        line1: string;
        line2?: string | null;
        city: string;
        state: string;
        postal_code: string;
        is_default: boolean;
    };

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [loadingAddresses, setLoadingAddresses] = useState(true);

    const navigate = useNavigate();
    const { items, totalPrice, clearCart } = useCart();
    const { isAuthenticated, user } = useAuth();

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    // y add hue h verify pincode k liye
    const [isServiceable, setIsServiceable] = useState(false);
    const [checkingServiceability, setCheckingServiceability] = useState(false);
    // yaha tak 
    const [promoCode, setPromoCode] = useState('');
    const [promoApplied, setPromoApplied] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [orderId, setOrderId] = useState<string | null>(null);

    const [paymentMethod, setPaymentMethod] = useState('card');

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);

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

    const loadRazorpay = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if ((window as any).Razorpay) {
                resolve(true);
                return;
            }
            

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;

            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);

            document.body.appendChild(script);
        });
    };


const openRazorpay = async (orderId: string) => {
  const loaded = await loadRazorpay();
  if (!loaded) {
  toast({
    title: "Payment Error",
    description: "Failed to load Razorpay",
    variant: "destructive",
  });
  return;
}


  const session = await supabase.auth.getSession();
  const accessToken = session.data.session?.access_token;

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ order_id: orderId }),
    }
  );

  const text = await res.text();
console.log("Raw Razorpay API response:", text);

if (!res.ok) {
  throw new Error(text || "Server error while creating Razorpay order");
}

const data = JSON.parse(text);
console.log("Parsed Razorpay response:", data);

  if (!data?.razorpay_order_id) {
    toast({
      title: "Payment initialization failed",
      description: "Razorpay order not created",
      variant: "destructive",
    });
    return;
  }

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: data.amount,
    currency: data.currency,
    order_id: data.razorpay_order_id,
    name: "Matica.life",

    handler: async (response: any) => {
      console.log("Payment Success:", response);

      // VERIFY PAYMENT HERE (very important)
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-razorpay-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            order_id: orderId,
            ...response,
          }),
        }
      );

      clearCart();
      setOrderPlaced(true);
      navigate("/orders");
    },

    modal: {
      ondismiss: function () {
        setIsProcessing(false);
        toast({
          title: "Payment cancelled",
          description: "You closed the payment window",
        });
      },
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
};




    // 2. Create a serviceability check function
const checkServiceability = async (pincode: string) => {
  setCheckingServiceability(true);
  try {
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delhivery-check-pincode?pincode=${pincode}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await res.json();
    setIsServiceable(data.is_serviceable);
         if (!data.is_serviceable) {
            toast({
                title: "Location Unserviceable",
                description: "Sorry, we don't deliver to this pincode yet.",
                variant: "destructive"
            });
        }
  } catch (err) {
        setIsServiceable(false);
  }
  finally {
    setCheckingServiceability(false);
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
    // 1️⃣ Validate Address
    if (!selectedAddressId) {
      toast({
        title: "No address selected",
        description: "Please select a shipping address",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    const payload = items.map(item => ({
      product_id: item.productId,
      quantity: item.quantity,
    }));

    // 2️⃣ Create Order in Supabase
    // This creates the record in your database first.
    const { data: orderId, error } = await supabase.rpc(
      "create_order_with_validation",
      {
        p_user_id: user.id,
        p_items: payload,
        p_shipping_address_id: selectedAddressId,
        p_payment_method: paymentMethod,
      }
    );

    if (error) throw error;
    setOrderId(orderId);

    // 3️⃣ Handle Logic Based on Payment Method
    if (paymentMethod === "cod") {
      // --- CASH ON DELIVERY FLOW ---
      // For COD, we create the shipment immediately since there's no payment barrier.
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      const delhiveryRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delhivery-create-shipment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            order_id: orderId,
            address: selectedAddress,
            items,
          }),
        }
      );

      const delhiveryData = await delhiveryRes.json();

      if (delhiveryData?.waybill_number) {
        // Store waybill in Supabase
        await supabase
          .from("orders")
          .update({ waybill_number: delhiveryData.waybill_number })
          .eq("id", orderId);
      }

      clearCart();
      setOrderPlaced(true);
      
    } else {
      // --- ONLINE PAYMENT FLOW (Razorpay) ---
      // We open Razorpay IMMEDIATELY. 
      // We don't call Delhivery here because if Delhivery fails, 
      // the user can't pay. You should trigger Delhivery from your 
      // Razorpay Webhook or after successful payment handler.
      
      await openRazorpay(orderId);
      
      //clearCart(); 
      // Note: setOrderPlaced(true) usually happens inside openRazorpay's success handler
    }

  } catch (err) {
    console.error("Order Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Please try again";
    toast({
      title: "Unable to place order",
      description: errorMessage,
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
        const loadAddresses = async () => {
            if (!user?.id) return;

            const { data, error } = await supabase
                .from("addresses")
                .select("*")
                .eq("user_id", user.id)
                .eq("is_active", true)
                .order("is_default", { ascending: false });

            if (error) {
                toast({
                    title: "Failed to load addresses",
                    variant: "destructive",
                });
                return;
            }

            setAddresses(data || []);
            setAddresses(data || []);
        const defaultAddr = data?.[0];
        setSelectedAddressId(defaultAddr?.id ?? null);
        
        // Check serviceability for the default address immediately
        if (defaultAddr?.postal_code) {
            checkServiceability(defaultAddr.postal_code);
        }
            setLoadingAddresses(false);
        };

        loadAddresses();
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
                            We've sent a confirmation email to {user?.email}
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
        <div className="bg-card rounded-2xl p-6 shadow-soft space-y-4 border">
            <h2 className="font-display text-2xl font-semibold">Select Shipping Address</h2>

            {loadingAddresses ? (
                <p className="text-muted-foreground">Loading addresses…</p>
            ) : (
                <> {/* 1. Parent wrapper to group everything together */}
                    <RadioGroup
                        value={String(selectedAddressId)}
                        onValueChange={(v) => {
                            const id = Number(v);
                            setSelectedAddressId(id);
                            setIsServiceable(false); // Reset status when a new address is picked
                        }}
                        className="space-y-3"
                    >
                        {addresses.map((addr) => (
                            <label key={addr.id} className={`block rounded-xl border p-4 cursor-pointer transition ${selectedAddressId === addr.id ? "border-primary bg-primary/5" : "border-border"}`}>
                                <div className="flex gap-3 items-start">
                                    <RadioGroupItem value={String(addr.id)} />
                                    <div>
                                        <p className="font-medium">{addr.full_name} · {addr.label}</p>
                                        <p className="text-sm text-muted-foreground">{addr.line1}, {addr.postal_code}</p>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </RadioGroup>

                    {/* 2. Wrapped in IF check to remove the red error on selectedAddress */}
                    {selectedAddress && (
                        <div className="mt-4 space-y-3 border-t pt-4">
                            <Button 
                                variant="outline" 
                                type="button"
                                onClick={() => checkServiceability(selectedAddress.postal_code)}
                                disabled={checkingServiceability}
                                className="w-full h-11 border-dashed border-2 hover:border-primary"
                            >
                                {checkingServiceability ? (
                                    <Clock className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Truck className="w-4 h-4 mr-2" />
                                )}
                                {checkingServiceability ? "Verifying..." : "Verify Delivery for this Pincode"}
                            </Button>

                            {/* Serviceability Status Message */}
                            <div className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                                isServiceable ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'
                            }`}>
                                {isServiceable ? <Check className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                <span className="text-sm font-medium">
                                    {isServiceable ? "Area is serviceable! You can proceed." : "Pincode not serviceable by Delhivery"}
                                </span>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="pt-4 border-t flex gap-3">
                <Button variant="outline" onClick={() => navigate("/addresses")} className="flex-1">
                    Manage Addresses
                </Button>
                <Button 
                    className="flex-1 btn-primary" 
                    // This button stays locked until pincode is verified (Green)
                    disabled={!isServiceable || checkingServiceability} 
                    onClick={() => setCurrentStep(2)}
                >
                    Continue to Payment
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

                                        {/* {paymentMethod === 'card' && (
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
                                        )} */}

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
                                    {selectedAddress && (
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
                                                <p className="font-medium text-foreground">{selectedAddress.full_name}</p>
                                                <p>
                                                    {selectedAddress.line1}
                                                    {selectedAddress.line2 && `, ${selectedAddress.line2}`}
                                                </p>
                                                <p>
                                                    {selectedAddress.city}, {selectedAddress.state} – {selectedAddress.postal_code}
                                                </p>
                                                <p>{selectedAddress.phone}</p>
                                            </div>
                                        </div>
                                    )}


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
