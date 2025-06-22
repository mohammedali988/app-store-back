import { Router } from "express";
import { usersRouter } from "../routes/allusers.routes.js";
import { adminRouter } from "../routes/admin.routes.js";
import { productRouter } from "../routes/product.routes.js";
import { cartRouter } from "../routes/cart.rotes.js";
import { stripePaymentRoutes } from "../routes/stripePayment.routes.js";
import { payPalRouter } from "../routes/payPal.routes.js";
import { categoryRouter } from "../routes/catogrery.rotes.js";
import { subcategoryRouter } from "../routes/SubCategory.rotes.js";



const v1Router = Router()

v1Router.use("/user",usersRouter)
v1Router.use("/admin",adminRouter)
v1Router.use("/product",productRouter)
v1Router.use("/cart",cartRouter)
v1Router.use("/stripePayment",stripePaymentRoutes)
v1Router.use("/paypalPayment",payPalRouter)
v1Router.use("/category",categoryRouter)
v1Router.use("/subcategory",subcategoryRouter)
export{v1Router}