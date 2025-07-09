import { Router } from "express";
import {
  getMyAccounnData,
  logIn,
  signup,
  ubdateAccountData,
  ubdatePassword,
} from "../control/allUsers.control.js";
import { upload } from "../utils/multer/multer.util.js";
import { autharication, authrazation } from "../middleware/auth.middleware.js";
import { cartRouter } from "./cart.rotes.js";
import { orderRouter } from "./orderId.routes.js";
import { ratingAndReviewRoter } from "./ratingAndRev.routes.js";
import { whishlistRouter } from "./wishlist.routes.js";
import { userModel } from "../model/user.model.js";
import { deleteMiddleware } from "../middleware/query.midlleware.js";
import { excuteMiddleware } from "../middleware/excute.middleware.js";
import { filterMiddleware } from "../middleware/feature.middleware.js";

const usersRouter = Router({ mergeParams: true });
usersRouter.post("/signUp", signup);
usersRouter.post("/login", logIn);
usersRouter.put("/updatepass", autharication, ubdatePassword);
usersRouter.get("/", autharication, getMyAccounnData);
usersRouter.put("/", autharication, ubdateAccountData);
usersRouter.delete(
  "/:id",
  autharication,
  authrazation("admin"),
  deleteMiddleware(userModel),
  filterMiddleware("_id", "id"),
  excuteMiddleware
);

usersRouter.use("/:id/cartitems", cartRouter);
usersRouter.use("/:id/order", orderRouter);
usersRouter.use("/:id/rating", ratingAndReviewRoter);
usersRouter.use("/:id/whishlistitem", whishlistRouter);

export { usersRouter };
