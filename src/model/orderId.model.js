import mongoose from "mongoose"

const orderSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:"true"
    },
    orderItem:[{
         count:{
                type:Number,
                required:true
            },
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product",
                required:"true"
            }
    }],
    totalAmount:{
        type:Number,
        default:0
    },
    totalprice:{
        type:Number,
        default:0
    },
    address:{
       state:{
        type:String,
        required:true

       },
       street:{
        type:String,
        required:true

       },
       description:{
        type:String,
        required:true

       }
    },
    phone:{
        type:String,
        required:true
    },
    isPaid: {
  type: Boolean,
  default: false
}
    
  
},{timestamps:true})
export const orderModel = mongoose.model("Order",orderSchema)