import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      minlength: [2, "title should unlees 2 "],
      maxlength: [30, "title should not be bigger 30"],
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
    quantity: {
      type: Number,
      default: 1,
      required: true,
    },
    color: {
      type: String,
    },
    size: {
      type: String,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      // required: [true, 'SubCategory must be belong to parent category'],
    },
    subCategory: {
      type: String,
    },
  },
  { timestamps: true }
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
