// routes/services.js
import Stripe from "stripe";
import dotenv from "dotenv";
import { Errorhandler, sendError } from "../service/errorHandler.js";
import { orderModel } from "../model/orderId.model.js";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//stripe payment from orderID model========================================================
export const stripePayment = Errorhandler(async (req, res) => {
    const { orderId } = req.body;
  
    const order = await orderModel.findById(orderId).populate("orderItem.productId");
    if (!order) throw new sendError(404, "Order not found");
  
    const priceData = order.orderItem.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productId.productName, 
        },
        unit_amount: item.productId.price * 100, // تأكد من وجود price في المنتج
      },
      quantity: item.count,
    }));
  
    const session = await stripe.checkout.sessions.create({
      line_items: priceData,
      mode: "payment",
      success_url: `${process.env.BASE_URL}/api/v1/stripePayment/payments/complete?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
      cancel_url: `${process.env.BASE_URL}/cancel`,
    });
  
    res.send({ url: session.url });
  });
  

  //complete paid===================================================
 
  export const completePayment = Errorhandler(async (req, res) => {
  const { session_id, orderId } = req.query;

  const [session, lineItems] = await Promise.all([
    stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent.payment_method"],
    }),
    stripe.checkout.sessions.listLineItems(session_id),
  ]);

  if (session.payment_status === "paid") {
    const order = await orderModel.findById(orderId);
    if (!order) throw new sendError(404, "Order not found");

    order.isPaid = true;

    order.totalprice = session.amount_total / 100;

    await order.save();

    return res.redirect("/pp");
  } else {
    return res.status(400).json({
      success: false,
      message: "Payment not completed",
      total: session.amount_total,
    });
  }
});

 
  