import { Router } from "express";
import { getMyAccounnData, logIn, signup, ubdateAccountData, ubdatePassword } from "../control/allUsers.control.js";
import { upload } from "../utils/multer/multer.util.js";
import { autharication } from "../middleware/auth.middleware.js";
import { cartRouter } from "./cart.rotes.js";
import { orderRouter } from "./orderId.routes.js";
import { ratingAndReviewRoter } from "./ratingAndRev.routes.js";
import { whishlistRouter } from "./wishlist.routes.js";
import { categoryRouter } from "./catogrery.rotes.js";
import { subcategoryRouter } from "./SubCategory.rotes.js";


const usersRouter = Router({mergeParams:true})
usersRouter.post("/signUp",signup)
usersRouter.post("/login",logIn)
usersRouter.put("/updatepass",autharication,ubdatePassword)
usersRouter.get("/",autharication,getMyAccounnData)
usersRouter.put("/", autharication,ubdateAccountData);

usersRouter.use("/:id/cartitems",cartRouter)
usersRouter.use("/:id/order",orderRouter)
usersRouter.use("/:id/rating",ratingAndReviewRoter)
usersRouter.use("/:id/whishlistitem",whishlistRouter)


export {usersRouter}