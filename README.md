# 🧵 Matica.life — Modern Commerce Platform

Matica.life is a modern, full-stack ecommerce platform focused on clean UX, reliable order flows, and scalable backend architecture.
It is built with a **production-first mindset** — not demos, not templates.

This repository contains the frontend application powering checkout, orders, authentication, and user flows.

---

## ✨ Features

### 🛒 Commerce

* Cart management with persistent state
* Multi-step checkout (Shipping → Payment → Confirmation)
* Promo code support
* Order confirmation & tracking
* Empty-state UX (cart, orders)

### 📦 Orders

* Order history with filters (pending, shipped, delivered)
* Detailed order view
* Visual order status timeline
* Cancelled order handling (archived state)

### 👤 Authentication

* Email-based authentication
* Auth-gated routes (orders, checkout)
* Modal-based login/signup flow

### 🧾 Data Integrity

* Server-side order validation
* Atomic order creation via Supabase RPC
* Address persistence with default address handling

---

## 🧠 Tech Stack

### Frontend

* **React + TypeScript**
* **React Router**
* **Tailwind CSS**
* **shadcn/ui**
* **Lucide Icons**
* **React Helmet (SEO)**

### Backend / Services

* **Supabase**

  * PostgreSQL
  * Auth
  * RPC functions
* Secure server-side order creation
* Relational data modeling (orders, order_items, products, addresses)

---

## 📁 Project Structure (Simplified)

```txt
src/
├─ components/
│  ├─ Header
│  ├─ Footer
│  ├─ CartDrawer
│  ├─ AuthModal
│
├─ context/
│  ├─ AuthContext
│  ├─ CartContext
│
├─ pages/
│  ├─ Checkout.tsx
│  ├─ Orders.tsx
│
├─ lib/
│  ├─ supabaseClient.ts
│
├─ hooks/
│  ├─ use-toast.ts
│
└─ ui/
   ├─ button
   ├─ card
   ├─ tabs
   ├─ badge
```

---

## 🔄 Checkout Flow

1. **Shipping**

   * Address capture
   * Default address loading
2. **Payment**

   * Card / UPI / Netbanking / COD
   * Method stored with order
3. **Confirmation**

   * Order summary
   * Server-validated order placement
   * Cart cleared only on success

Order creation is handled via a **Supabase RPC** to ensure:

* Stock validation
* Atomic inserts
* No client-side tampering

---

## 📊 Order Lifecycle

Order statuses currently supported:

* `pending` — order placed
* `paid` — payment confirmed
* `shipped` — handed to courier
* `delivered` — completed
* `cancelled` — archived state

Cancelled orders:

* Remain visible under **All Orders**
* Do not progress through delivery stages
* Are treated as terminal state

---

## 🧪 Error Handling & UX

* Graceful empty states (cart, orders)
* Loading skeletons
* Non-blocking product metadata fetch
* Toast-based feedback for all critical actions
* Defensive UI against partial data

---

## 🛠 Environment Setup

### Prerequisites

* Node.js ≥ 18
* npm / pnpm / yarn
* Supabase project

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Install & Run

```bash
npm install
npm run dev
```

---

## 🔐 Security Notes

* Sensitive operations (order creation) are **never trusted to the client**
* Supabase Row Level Security (RLS) is assumed enabled
* User-specific data is always filtered by `user_id`

---

## 🚧 Roadmap (Intentional, Not Promises)

* Refund & cancellation flows
* Shipment tracking integration
* Address book UI
* Admin order dashboard
* Email & WhatsApp notifications

---

## 🧩 Design Philosophy

* UX > clever abstractions
* Empty states matter
* End-states should feel intentional
* Production realism over demo polish

This project is built to **scale forward**, not to impress in screenshots.

---

## 📜 License

Private / Proprietary
All rights reserved.
