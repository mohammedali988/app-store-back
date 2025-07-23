import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: "true",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: "true",
    },
    rating: {
      type: Number,
      required: "true",
    },
    review: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

ratingSchema.pre(/^find/, function (next) {
  this.populate({
     path: "userId",
    select: "name email",
  });
  next();
});

export const ratingModel = mongoose.model("Rating", ratingSchema);
