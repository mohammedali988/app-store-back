// server/chat/tools.js

export const customerTools = [
  {
    name: "search_products",
    description:
      "Search products by keyword, category, subcategory, price range, color, or stock availability. " +
      "Use minPrice for 'more than X', maxPrice for 'less than X', or both for a range like 'between X and Y'. " +
      "Use color to filter by product color (e.g. 'red', 'black'). " +
      "Use category/subCategory for browsing a specific section of the store. " +
      "Use inStockOnly to exclude out-of-stock items.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keyword matching product name or description",
        },
        category: {
          type: "string",
          description: "Category name, e.g. 'Electronics', 'Clothing'",
        },
        subCategory: {
          type: "string",
          description: "Subcategory name, e.g. 'Phones', 'Men', 'Running'",
        },
        minPrice: {
          type: "number",
          description: "Minimum price filter",
        },
        maxPrice: {
          type: "number",
          description: "Maximum price filter",
        },
        color: {
          type: "string",
          description:
            "Filter by product color (matches the 'color' attribute)",
        },
        inStockOnly: {
          type: "boolean",
          description: "If true, only return products with stock.value > 0",
        },
        limit: {
          type: "number",
          description: "Max number of results to return (default 6, max 20)",
        },
      },
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
  {
    name: "find_matching_products",
    description:
      "Find products that would pair well with a reference product the customer has or is looking at " +
      "(e.g. 'I bought a red t-shirt, what pants would go with it?'). " +
      "Returns candidate products from the target category/subcategory, optionally filtered by color, " +
      "along with the reference product's own details (color, category, attributes) so you can reason " +
      "about which candidates actually match and explain why.",
    input_schema: {
      type: "object",
      properties: {
        referenceProductId: {
          type: "string",
          description:
            "The _id of the reference product, if known (from a previous search result)",
        },
        referenceProductName: {
          type: "string",
          description:
            "The name of the reference product, if the ID isn't known",
        },
        targetCategory: {
          type: "string",
          description: "Category to search for matching items, e.g. 'Clothing'",
        },
        targetSubCategory: {
          type: "string",
          description:
            "Subcategory to search for matching items, e.g. 'Men', 'Accessories'",
        },
        color: {
          type: "string",
          description:
            "Optional color to filter candidates by — use this for 'same color' or " +
            "complementary color suggestions you decide on",
        },
        limit: {
          type: "number",
          description: "Max number of candidates to return (default 6, max 15)",
        },
      },
      required: ["targetCategory"],
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
  {
    name: "get_orders_by_status",
    description:
      "Get orders filtered by fulfillment status (pending, processing, shipped, delivered, cancelled) " +
      "and/or payment status. Use this for queries like 'show me all orders that haven't been delivered yet' " +
      "(status not 'delivered'), 'show pending orders', or 'unpaid orders'.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
          description: "Filter by exact status. Omit to include all statuses.",
        },
        excludeStatus: {
          type: "string",
          enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
          description:
            "Exclude this status — e.g. excludeStatus='delivered' for 'orders not yet delivered'",
        },
        isPaid: {
          type: "boolean",
          description: "Filter by payment status",
        },
        limit: {
          type: "number",
          description: "Max number of orders to return (default 20, max 50)",
        },
      },
    },
  },
  {
    name: "update_order_status",
    description:
      "Update the fulfillment status of an order (e.g. mark as shipped or delivered). " +
      "Always confirm the order ID and new status back to the admin after updating.",
    input_schema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "The _id of the order to update",
        },
        status: {
          type: "string",
          enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
          description: "The new status to set",
        },
      },
      required: ["orderId", "status"],
    },
  },
  {
    name: "get_user_info",
    description:
      "Get detailed information about a customer account: status (active/inactive), role, balance, " +
      "address, and recent order history. Use this for questions like 'is this user active?', " +
      "'what's this customer's balance?', or 'show me this user's orders'.",
    input_schema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The _id of the user, if known",
        },
        email: {
          type: "string",
          description: "The email of the user, if ID isn't known",
        },
        name: {
          type: "string",
          description:
            "The name (or partial name) of the user, if email/ID aren't known",
        },
      },
    },
  },

  ...customerTools,
];
