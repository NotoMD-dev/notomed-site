// src/app/api/support/checkout/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";

let stripe: Stripe | null = null;

function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set in env");
  }

  if (!stripe) {
    stripe = new Stripe(stripeSecretKey);
  }

  return stripe;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const amount = Number(body.amount); // dollars

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const amountInCents = Math.round(amount * 100);

    // 1) Prefer explicit base URL
    // 2) Fall back to request origin
    // 3) Finally default to localhost (dev)
    const origin =
      process.env.NEXT_PUBLIC_BASE_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    const stripeClient = getStripeClient();

    const session = await stripeClient.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Support NotoMed.dev",
              description: "A tip to support the clinical tools.",
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/support/success`,
      cancel_url: `${origin}/support/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Stripe error" }, { status: 500 });
  }
}
