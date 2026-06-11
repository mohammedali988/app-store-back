// server/chat/tools.js

export const customerTools = [
  {
    name: "search_products",
    description: "Search products by keyword, category, price range, or color",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keyword" },
        maxPrice: { type: "number" },
        category: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_order_status",
    description: "Get the status of a customer order by order ID",
    input_schema: {
      type: "object",
      properties: {
        orderId: { type: "string" },
      },
      required: ["orderId"],
    },
  },
  {
    name: "get_product_details",
    description: "Get full details of a product by ID or name",
    input_schema: {
      type: "object",
      properties: {
        productId: { type: "string" },
        productName: { type: "string" },
      },
    },
  },
];

export const adminTools = [
  {
    name: "get_sales_analytics",
    description:
      "Get sales totals, order counts, and revenue for a time period",
    input_schema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["today", "this_week", "this_month", "last_month"],
        },
      },
      required: ["period"],
    },
  },
  {
    name: "get_low_stock_products",
    description: "List products with stock below a threshold",
    input_schema: {
      type: "object",
      properties: {
        threshold: {
          type: "number",
          description: "Stock level threshold, default 10",
        },
      },
    },
  },
  {
    name: "update_product_price",
    description: "Update the price of a product by its ID or SKU",
    input_schema: {
      type: "object",
      properties: {
        productId: { type: "string" },
        newPrice: { type: "number" },
      },
      required: ["productId", "newPrice"],
    },
  },
  {
    name: "get_pending_orders",
    description: "Fetch all orders with pending or processing status",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number" },
      },
    },
  },
  {
    name: "get_top_customers",
    description: "Get top customers by total spend in a given period",
    input_schema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["this_month", "this_year", "all_time"],
        },
        limit: { type: "number" },
      },
      required: ["period"],
    },
  },

  ...customerTools,
];
