import { orderModel } from "../../model/orderId.model.js";
import { productModel } from "../../model/product.model.js";
import { userModel } from "../../model/user.model.js";

export async function executeTool(toolName, toolInput, userId, role) {
  switch (toolName) {
    case "search_products": {
      const filter = {};
      if (toolInput.query) filter.$text = { $search: toolInput.query };
      if (toolInput.maxPrice) filter.price = { $lte: toolInput.maxPrice };
      if (toolInput.category) filter.category = toolInput.category;
      const products = await productModel.find(filter).limit(6).lean();
      return products.map((p) => ({
        id: p._id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        category: p.category,
        image: p.images?.[0],
      }));
    }

    case "get_order_status": {
      const query = { _id: toolInput.orderId };
      // Customers can only see their own orders
      if (role === "customer") query.user = userId;
      const order = await orderModel.findOne(query).lean();
      if (!order) return { error: "Order not found" };
      return {
        id: order._id,
        status: order.status,
        total: order.totalPrice,
        createdAt: order.createdAt,
        items: order.orderItems?.length,
      };
    }

    case "get_product_details": {
      const filter = toolInput.productId
        ? { _id: toolInput.productId }
        : { name: new RegExp(toolInput.productName, "i") };
      const product = await productModel.findOne(filter).lean();
      if (!product) return { error: "Product not found" };
      return product;
    }

    case "get_sales_analytics": {
      const now = new Date();
      let startDate;
      if (toolInput.period === "today")
        startDate = new Date(now.setHours(0, 0, 0, 0));
      else if (toolInput.period === "this_week") {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else if (toolInput.period === "this_month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      }

      const result = await orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
            orderCount: { $sum: 1 },
            avgOrderValue: { $avg: "$totalPrice" },
          },
        },
      ]);
      return result[0] || { totalRevenue: 0, orderCount: 0, avgOrderValue: 0 };
    }

    case "get_low_stock_products": {
      const threshold = toolInput.threshold ?? null;

      const products = await productModel
        .find({
          // Use per-product threshold if no global threshold given
          $expr: {
            $lte: [
              "$stock.value",
              threshold ? threshold : "$stock.lowStockThreshold",
            ],
          },
          availability: true, // only show products still active
        })
        .select("productName stock sold price")
        .lean();

      return products.map((p) => ({
        name: p.productName,
        stock: `${p.stock.value} ${p.stock.unit}`,
        lowStockThreshold: `${p.stock.lowStockThreshold} ${p.stock.unit}`,
        sold: p.sold,
        price: p.price,
        status: p.stock.value === 0 ? "Out of Stock" : "Low Stock",
      }));
    }

    case "update_product_price": {
      const updated = await productModel
        .findByIdAndUpdate(
          toolInput.productId,
          { price: toolInput.newPrice },
          { new: true },
        )
        .lean();
      if (!updated) return { error: "Product not found" };
      return { success: true, product: updated.name, newPrice: updated.price };
    }

    case "get_pending_orders": {
      const orders = await orderModel
        .find({ status: { $in: ["pending", "processing"] } })
        .limit(toolInput.limit ?? 20)
        .populate("user", "name email")
        .lean();
      return orders.map((o) => ({
        id: o._id,
        customer: o.user?.name,
        total: o.totalPrice,
        status: o.status,
        createdAt: o.createdAt,
      }));
    }

    case "get_top_customers": {
      const now = new Date();
      let matchDate = {};
      if (toolInput.period === "this_month")
        matchDate = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
      else if (toolInput.period === "this_year")
        matchDate = { $gte: new Date(now.getFullYear(), 0, 1) };

      const pipeline = [
        ...(Object.keys(matchDate).length
          ? [{ $match: { createdAt: matchDate } }]
          : []),
        {
          $group: {
            _id: "$user",
            totalSpent: { $sum: "$totalPrice" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: toolInput.limit ?? 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            name: "$user.name",
            email: "$user.email",
            totalSpent: 1,
            orders: 1,
          },
        },
      ];
      return await orderModel.aggregate(pipeline);
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
