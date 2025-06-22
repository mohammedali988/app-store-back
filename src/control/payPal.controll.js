// routes/services.js
import paypalClient from "../service/paypal.js"; // استدعاء الملف الجديد
import paypal from "@paypal/checkout-server-sdk";
import { Errorhandler, sendError } from "../service/errorHandler.js";
import { orderModel } from "../model/orderId.model.js";

export const paypalPayment = Errorhandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await orderModel.findById(orderId).populate("orderItem.productId");
  if (!order) throw new sendError(404, "Order not found");

  const items = order.orderItem.map(item => ({
    name: item.productId.productName,
    unit_amount: {
      currency_code: "USD",
      value: item.productId.price.toFixed(2),
    },
    quantity: item.count.toString(),
  }));

  const totalAmount = order.orderItem.reduce(
    (sum, item) => sum + item.productId.price * item.count,
    0
  );

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [{
      amount: {
        currency_code: "USD",
        value: totalAmount.toFixed(2),
        breakdown: {
          item_total: {
            currency_code: "USD",
            value: totalAmount.toFixed(2),
          },
        },
      },
      items: items, 
    }],
    application_context: {
      return_url: `${process.env.BASE_URL}/api/v1/stripePayment/payments/complete?orderId=${orderId}`,
      cancel_url: `${process.env.BASE_URL}/cancel`,
    },
  });

  const orderPayPal = await paypalClient.client().execute(request);
  const approvalUrl = orderPayPal.result.links.find(link => link.rel === "approve").href;

  res.send({ url: approvalUrl });
});


// routes/services.js
export const completePaypalPayment = Errorhandler(async (req, res) => {
  const { token, orderId } = req.query;

  const request = new paypal.orders.OrdersCaptureRequest(token);
  request.requestBody({});

  const capture = await paypalClient.client().execute(request);

  if (capture.result.status === "COMPLETED") {
    const order = await orderModel.findById(orderId);
    if (!order) throw new sendError(404, "Order not found");

    const totalAmount = parseFloat(
      capture.result.purchase_units[0].payments.captures[0].amount.value
    );

    order.isPaid = true;
    order.totalprice = totalAmount;
    await order.save();

    return res.redirect("/pp");
  } else {
    return res.status(400).json({
      success: false,
      message: "Payment not completed",
    });
  }
});

