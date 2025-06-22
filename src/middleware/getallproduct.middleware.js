import { Errorhandler } from "../service/errorHandler.js";

export const getAllProducts = Errorhandler(async (req, res) => {
  const products = await req.queryMongoose;

  res.status(200).json({
    message: "sucesses",
    meta: req.meta,
    data: products, 
  });
});
