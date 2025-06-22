import { Router } from "express";
import { autharication } from "../middleware/auth.middleware.js";
import { completePaypalPayment, paypalPayment } from "../control/payPal.controll.js";

const payPalRouter = Router()
payPalRouter.post("/paypal/payment",autharication,paypalPayment)
payPalRouter.get("/complete",completePaypalPayment)
export {payPalRouter}  