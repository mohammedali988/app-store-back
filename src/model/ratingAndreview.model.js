import mongoose from "mongoose";

const ratingAndReviewSchema = new mongoose.Schema({
    rating:{
        type:Number,
        required:true
    },
    review:{
        type:String
    },
    addedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
        required:"true"
    }
},{timestamps:true})

export const ratingAndReviewModel= mongoose.model("RatingAndReview",ratingAndReviewSchema)