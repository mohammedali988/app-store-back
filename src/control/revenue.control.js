import { orderModel } from "../model/orderId.model.js";
import { Errorhandler } from "../service/errorHandler.js";

export const getRevenue = Errorhandler(async (req, res) => {
  try {
    const months = req.query.range === "12m" ? 12 : 6;
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const orders = await orderModel
      .find({
        createdAt: { $gte: since },
      })
      .populate("orderItem.productId", "price");

    // group by month
    const map = {};
    orders.forEach((order) => {
      const key = order.createdAt.toISOString().slice(0, 7); // "2026-01"
      if (!map[key]) map[key] = { revenue: 0, orders: 0, unitsSold: 0 };
      map[key].orders += 1;
      order.orderItem.forEach((item) => {
        const price = item.productId?.price ?? 0;
        const qty = item.quantity ?? 1;
        map[key].revenue += price * qty;
        map[key].unitsSold += qty;
      });
    });

    // build sorted array
    const result = Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    // summary totals (current month vs previous)
    const totalRevenue = result.reduce((s, r) => s + r.revenue, 0);
    const totalOrders = result.reduce((s, r) => s + r.orders, 0);
    const totalUnits = result.reduce((s, r) => s + r.unitsSold, 0);
    const avgOrderValue =
      totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0;

    res.json({
      success: true,
      data: result,
      summary: { totalRevenue, totalOrders, avgOrderValue, totalUnits },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
