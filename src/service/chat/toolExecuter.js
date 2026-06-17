import { orderModel } from "../../model/orderId.model.js";
import { productModel } from "../../model/product.model.js";
import { userModel } from "../../model/user.model.js";
import { Categorymodel } from "../../model/category.model.js";

export async function executeTool(toolName, toolInput, userId, role) {
  switch (toolName) {
    case "search_products": {
      const filter = { availability: true };

      // Keyword search across product name and description
      if (toolInput.query) {
        filter.$or = [
          { productName: { $regex: toolInput.query, $options: "i" } },
          { description: { $regex: toolInput.query, $options: "i" } },
        ];
      }

      // Category filter — look up the category by name to get its ObjectId
      if (toolInput.category) {
        const categoryDoc = await Categorymodel.findOne({
          name: { $regex: `^${toolInput.category}$`, $options: "i" },
        }).lean();

        if (categoryDoc) {
          filter.category = categoryDoc._id;
        } else {
          // No matching category — return empty results rather than ignoring the filter
          return {
            products: [],
            note: `No category found matching "${toolInput.category}"`,
          };
        }
      }

      // Subcategory filter (case-insensitive exact match)
      if (toolInput.subCategory) {
        filter.subCategory = {
          $regex: `^${toolInput.subCategory}$`,
          $options: "i",
        };
      }

      // Price range
      if (
        toolInput.minPrice !== undefined ||
        toolInput.maxPrice !== undefined
      ) {
        filter.price = {};
        if (toolInput.minPrice !== undefined)
          filter.price.$gte = toolInput.minPrice;
        if (toolInput.maxPrice !== undefined)
          filter.price.$lte = toolInput.maxPrice;
      }

      // Color filter — attributes is a Map, "color" can be a string or array
      if (toolInput.color) {
        filter["attributes.color"] = { $regex: toolInput.color, $options: "i" };
      }

      // Stock filter
      if (toolInput.inStockOnly) {
        filter["stock.value"] = { $gt: 0 };
      }

      const limit = Math.min(toolInput.limit ?? 6, 20);

      const products = await productModel.find(filter).limit(limit).lean();

      return {
        count: products.length,
        products: products.map((p) => ({
          id: p._id,
          name: p.productName,
          price: p.price,
          discount: p.discount,
          priceAfterDiscount:
            p.discount > 0
              ? Math.round((p.price - (p.price * p.discount) / 100) * 100) / 100
              : p.price,
          category: p.category?.name ?? null,
          subCategory: p.subCategory,
          stock: p.stock ? `${p.stock.value} ${p.stock.unit}` : "unknown",
          inStock: p.stock?.value > 0,
          attributes: p.attributes,
          image: p.productImages?.[0]?.filePath,
        })),
      };
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
        .populate("userId")
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
    case "find_matching_products": {
      let referenceProduct = null;

      // Try to load the reference product if provided
      if (toolInput.referenceProductId) {
        referenceProduct = await productModel
          .findById(toolInput.referenceProductId)
          .lean();
      } else if (toolInput.referenceProductName) {
        referenceProduct = await productModel
          .findOne({
            productName: {
              $regex: toolInput.referenceProductName,
              $options: "i",
            },
          })
          .lean();
      }

      // Build the candidate filter
      const filter = { availability: true, "stock.value": { $gt: 0 } };

      // Resolve target category name → ObjectId
      const categoryDoc = await Categorymodel.findOne({
        name: { $regex: `^${toolInput.targetCategory}$`, $options: "i" },
      }).lean();

      if (!categoryDoc) {
        return {
          note: `No category found matching "${toolInput.targetCategory}"`,
          candidates: [],
        };
      }
      filter.category = categoryDoc._id;

      if (toolInput.targetSubCategory) {
        filter.subCategory = {
          $regex: `^${toolInput.targetSubCategory}$`,
          $options: "i",
        };
      }

      // Optional color filter on candidates
      if (toolInput.color) {
        filter["attributes.color"] = { $regex: toolInput.color, $options: "i" };
      }

      // Exclude the reference product itself from results
      if (referenceProduct) {
        filter._id = { $ne: referenceProduct._id };
      }

      const limit = Math.min(toolInput.limit ?? 6, 15);
      const candidates = await productModel.find(filter).limit(limit).lean();

      return {
        referenceProduct: referenceProduct
          ? {
              id: referenceProduct._id,
              name: referenceProduct.productName,
              category: referenceProduct.category?.name ?? null,
              subCategory: referenceProduct.subCategory,
              price: referenceProduct.price,
              attributes: referenceProduct.attributes,
            }
          : null,
        candidates: candidates.map((p) => ({
          id: p._id,
          name: p.productName,
          price: p.price,
          discount: p.discount,
          priceAfterDiscount:
            p.discount > 0
              ? Math.round((p.price - (p.price * p.discount) / 100) * 100) / 100
              : p.price,
          category: p.category?.name ?? null,
          subCategory: p.subCategory,
          attributes: p.attributes,
          stock: p.stock ? `${p.stock.value} ${p.stock.unit}` : "unknown",
          image: p.productImages?.[0]?.filePath,
        })),
        instructions:
          "Use the referenceProduct's color/style/attributes to decide which candidates pair well. " +
          "Explain your reasoning to the customer (color coordination, style match, occasion, etc).",
      };
    }
    case "get_orders_by_status": {
      const filter = {};

      if (toolInput.status) {
        // Exact status takes priority over excludeStatus
        filter.status = toolInput.status;
      } else if (toolInput.excludeStatus) {
        filter.status = { $ne: toolInput.excludeStatus };
      }

      if (toolInput.isPaid !== undefined) {
        filter.isPaid = toolInput.isPaid;
      }

      const limit = Math.min(toolInput.limit ?? 20, 50);

      const orders = await orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return {
        count: orders.length,
        orders: orders.map((o) => ({
          id: o._id,
          customer: o.userId?.name ?? "Unknown",
          email: o.userId?.email ?? null,
          status: o.status,
          isPaid: o.isPaid,
          totalPrice: o.totalprice,
          itemCount: o.orderItem?.length ?? 0,
          address: `${o.address?.state}, ${o.address?.street}`,
          createdAt: o.createdAt,
        })),
      };
    }

    case "update_order_status": {
      const validStatuses = [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];

      if (!validStatuses.includes(toolInput.status)) {
        return { error: `Invalid status "${toolInput.status}"` };
      }

      const updated = await orderModel
        .findByIdAndUpdate(
          toolInput.orderId,
          { status: toolInput.status },
          { new: true },
        )
        .lean();

      if (!updated) {
        return { error: `Order ${toolInput.orderId} not found` };
      }

      return {
        success: true,
        orderId: updated._id,
        customer: updated.userId?.name ?? "Unknown",
        newStatus: updated.status,
      };
    }

    case "get_user_info": {
      const filter = {};

      if (toolInput.userId) {
        filter._id = toolInput.userId;
      } else if (toolInput.email) {
        filter.email = { $regex: `^${toolInput.email}$`, $options: "i" };
      } else if (toolInput.name) {
        filter.name = { $regex: toolInput.name, $options: "i" };
      } else {
        return { error: "Provide userId, email, or name to look up a user" };
      }

      const user = await userModel
        .findOne(filter)
        .select("-password -paymentData")
        .lean();

      if (!user) {
        return { error: "User not found" };
      }

      // Get recent orders for this user
      const orders = await orderModel
        .find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        active: user.active,
        address: user.adress,
        balance: user.balance,
        withdrawableBalance: user.withdrawableBalance,
        memberSince: user.createdAt,
        recentOrders: orders.map((o) => ({
          id: o._id,
          status: o.status,
          isPaid: o.isPaid,
          totalPrice: o.totalprice,
          createdAt: o.createdAt,
        })),
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
