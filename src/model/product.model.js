import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
      minlength: [30, "description should unlees 10 "],
    },

    productImages: [
      {
        filePath: {
          type: String,
          required: true,
        },
        fileId: {
          type: String,
          required: true,
        },
      },
    ],

    price: {
      type: Number,
      required: true,
    },

    discount: {
      type: Number,
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    availability: {
      type: Boolean,
      default: true,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: { type: String, required: true, trim: true },

    attributes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);
productSchema.pre(/^find/, function (next) {
  this.populate({
    path: "category",
  });
  next();
});
productSchema.pre("save", function (next) {
  if (this.discount > 0) {
    this.priceAfterDiscount = this.price - (this.price * this.discount) / 100;
  } else {
    this.priceAfterDiscount = this.price;
  }

  this.availability = this.quantity > 0;

  next();
});

productSchema.pre("save", function (next) {
  if (this.quantity === 0) {
    this.availability = false;
  } else {
    this.availability = true;
  }
  next();
});

export const productModel = mongoose.model("Product", productSchema);
