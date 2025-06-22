import mongoose from "mongoose";

let categorySchema = new mongoose.Schema({
  // userId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "User",
  // },
  
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: [3, "Title is short"],
    unique: [true, 'SubCategory must be unique'],

  },
  imageSrc: {
    type: String,
    trim: true,
  },
 
},{timestamps:true});

export const Categorymodel = mongoose.model("Category", categorySchema);
