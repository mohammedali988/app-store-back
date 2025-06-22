import mongoose from "mongoose";

const userSchem = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        // minlength: [5,"name should unlees 5 "],
        // maxlength: [22,"name should not be bigger 22"]

    },
    phone:{
        type:Number
    },
    email:{
        type:String,
        required:true,
        //  match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
         unique:true
    },
   
    password:{
        type:String,
        required: true,
        // minlength: [5,"password should unlees 5 "],
        // maxlength: [18,"password should not be bigger 18"]
    },
    adress:{
        country:{
            type:String,

        },
        city:{
            type:String,
        },
       street: {
           type:String,
        }
    },
    active:{
        type:Boolean,
        default:true
    },
    role:{
        type:String,
        default :"user",
        enum : ["user","admin"]
    },
   personalImages: {
        filePath: {
          type: String,
          required: true,
        },
      },

    paymentData: {
        token: {
          type: String,
        },
        name: {
          type: String,
        },
        last4Numbers: {
          type: String,
        },
      },
    
      balance: {
        type: Number,
        default: 0,
      },
      withdrawableBalance: {
        type: Number,
        default: 0,
      },
},{timestamps:true})

export const userModel = mongoose.model("User",userSchem)