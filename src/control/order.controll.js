import { cartModel } from "../model/cart.model.js";
import { orderModel } from "../model/orderId.model.js";
import { Errorhandler, sendError } from "../service/errorHandler.js";
//make order and delete from cart=========================================================

export const makeOrder = Errorhandler(async (req, res) => {
    const { id } = req.params;
    const { cartId, address,phone} = req.body;

    if (!Array.isArray(cartId) || cartId.length === 0)
        throw new sendError(400, "cartId must be a non-empty array.");

    if (!address || !address.state)
        throw new sendError(400, "Address is incomplete or missing.");

    let orderItem = [];
    let totalprice = 0;
    let totalAmount = 0;

    const cartItems = await cartModel.find({ _id: { $in: cartId }, userId: id }).populate("productId");
    if (!cartItems || cartItems.length === 0)
        throw new sendError(400, "No cart items found for the given cartId.");

    for (const item of cartItems) {
        const product = item.productId;
        const count = item.count;

        if (!product || typeof product.price !== "number" || typeof count !== "number") continue;

        if (product.quantity < count) {
            throw new sendError(400, `Only ${product.quantity} units available for product: ${product.productName}`);
        }

        product.quantity -= count;
        product.sold += count;
        product.availability = product.quantity > 0;
        await product.save();

        orderItem.push({
            productId: product._id,
            count: count
        });

        totalprice += product.price * count;
        totalAmount += count;
    }

    if (orderItem.length === 0)
        throw new sendError(400, "No valid cart items found to create an order.");

    const result = await orderModel.create({
        userId: id,
        orderItem,
        totalAmount,
        totalprice,
        address,
        phone, 
        isPaid: false
    });

    if (!result)
        throw new sendError(400, "Failed to create the order.");

    await cartModel.deleteMany({ _id: { $in: cartId }, userId: id });

    res.status(200).json({
        message: "Order created successfully and selected cart items removed.",
        data: result,
    });
});
//get all order for admin================================================================
export const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.find()
      .populate({ path: "userId", select: "username" });  

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};