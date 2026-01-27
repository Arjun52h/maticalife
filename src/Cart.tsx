import React from "react";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";

const CartPage: React.FC = () => {
  const { items, total, removeFromCart } = useCart();

  return (
    <section className="py-16 bg-lightbg">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="font-heading text-3xl text-accent mb-6">Your Cart</h1>

        {!items.length ? (
          <div className="text-center py-10 text-darktext/70">
            <p>Your cart is empty.</p>
            <Link
              to="/shop"
              className="text-primary underline underline-offset-2 text-sm"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-6 mb-10">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-4 border-b border-border/40 pb-4"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-xl bg-[#e7dccd]"
                  />

                  <div className="flex-1">
                    <h3 className="font-heading text-accent">{product.name}</h3>
                    <p className="text-sm text-darktext/70">
                      ₹{product.price.toLocaleString("en-IN")} × {quantity}
                    </p>

                    <button
                      className="text-xs text-primary underline mt-2"
                      onClick={() => removeFromCart(product.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right">
              <p className="text-lg font-heading text-accent mb-3">
                Total: ₹{total.toLocaleString("en-IN")}
              </p>
              <button className="px-6 py-3 bg-primary text-white rounded-full text-sm hover:bg-accent">
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CartPage;
