import { Categorymodel } from "../model/category.model.js";
import { productModel } from "../model/product.model.js";
import { ratingModel } from "../model/rating.model.js";
import { Errorhandler, sendError } from "../service/errorHandler.js";

export const addProduct = Errorhandler(async (req, res) => {
  const addNewPrpduct = await productModel.create({ ...req.body });
  if (!addNewPrpduct) throw new sendError(400, "Error in added product");
  res.status(200).json({
    message: "sucesses,",
    data: addNewPrpduct,
  });
});
export const getMiddlewarefilter = (model) =>
  Errorhandler(async (req, res, next) => {
    const filter = {};

    if (req.query.category) {
      const category = await Categorymodel.findOne({
        name: { $regex: `^${req.query.category}$`, $options: "i" },
      });

      if (!category) throw new sendError(404, "Category name not found");

      filter.category = category._id;
    }

    if (req.query.name) {
      filter.productName = { $regex: req.query.name, $options: "i" };
    }

    req.filter = filter;

    let queryObj = model.find(filter);

    if (req.query.sort === "top-rated") {
      queryObj = queryObj.sort({ ratingAvg: -1 });
    } else if (req.query.sort === "top-Selling") {
      queryObj = queryObj.sort({ sold: -1 });
    } else if (req.query.sort === "all") {
      queryObj = queryObj.find();
    } else if (req.query.sort === "high-price") {
      queryObj = queryObj.sort({ price: -1 });
    } else if (req.query.sort === "low-price") {
      queryObj = queryObj.sort({ sold: 1 });
    } else if (req.query.sort === "low-selling") {
      queryObj = queryObj.sort({ sold: 1 });
    } else if (
      req.query.sort &&
      !["top-rated", "most-sold"].includes(req.query.sort)
    ) {
      throw new sendError(
        400,
        "Invalid sort type. Use 'top-rated' or 'most-sold'"
      );
    }

    req.queryMongoose = queryObj;
    next();
  });

export const getAllRating = Errorhandler(async (req, res) => {
  const rating = await ratingModel.find({ productId: req.params.productId });
  if (!rating) throw new sendError(400, "Error in fetch rate for the product");
  res.status(200).json({
    message: "success,",
    data: rating,
  });
});
