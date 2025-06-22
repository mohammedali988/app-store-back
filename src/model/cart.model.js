import mongoose from "mongoose"

const cartSchema = new mongoose.Schema({
    count:{
        type:Number,
        required:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:"true"
    },
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
        required:"true"
    }
},{timestamps:true})

cartSchema.pre(/^find/,function(next){
    this.populate({
        path:"productId"
    })
    next();
})


export const cartModel = mongoose.model("Cart",cartSchema)