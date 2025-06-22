import { productModel } from "../model/product.model.js";
import { ratingAndReviewModel } from "../model/ratingAndreview.model.js";
import { Errorhandler, sendError } from "../service/errorHandler.js";

export const addRatingAndReview = Errorhandler(async(req,res)=>{
    const{rating,review,productId}=req.body
    const { _id: userId } = req.docodedToken;
     
    const book = await productModel.findById(productId);
    if(!book)throw new sendError(400,"product not found")
  
      const newRatingAndReview = await ratingAndReviewModel.create({rating,review,productId,addedBy:userId})
      if(!newRatingAndReview)throw new sendError(400,"can not Rating and Review")
      res.status(200).json({
       message:"sucesses!",
       data: newRatingAndReview
      })
  })