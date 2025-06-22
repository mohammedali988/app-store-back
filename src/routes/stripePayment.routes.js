import { Router } from "express";
import { autharication } from "../middleware/auth.middleware.js";
import { completePayment, stripePayment } from "../control/stripe.control.js";

const stripePaymentRoutes = Router()

stripePaymentRoutes.post("/services", autharication,stripePayment);
stripePaymentRoutes.get("/payments/complete", completePayment);

export{stripePaymentRoutes} 