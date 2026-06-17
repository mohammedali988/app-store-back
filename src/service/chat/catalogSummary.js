import { productModel } from "../../model/product.model.js";
import { Categorymodel } from "../../model/category.model.js";

// Simple in-memory cache — avoids rebuilding on every chat message
let cachedSummary = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getCatalogSummary({ forceRefresh = false } = {}) {
  const now = Date.now();

  if (!forceRefresh && cachedSummary && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSummary;
  }

  const summary = await buildCatalogSummary();
  cachedSummary = summary;
  cacheTimestamp = now;

  return summary;
}

// Call this after creating/updating/deleting a product to refresh immediately
export function invalidateCatalogCache() {
  cachedSummary = null;
  cacheTimestamp = 0;
}

async function buildCatalogSummary() {
  // Aggregate products grouped by category
  const categoryStats = await productModel.aggregate([
    { $match: { availability: true } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        subCategories: { $addToSet: "$subCategory" },
      },
    },
  ]);

  // Aggregate low stock count overall
  const lowStockCount = await productModel.countDocuments({
    $expr: { $lte: ["$stock.value", "$stock.lowStockThreshold"] },
    "stock.value": { $gt: 0 },
  });

  const outOfStockCount = await productModel.countDocuments({
    "stock.value": 0,
  });

  // Total product count
  const totalProducts = await productModel.countDocuments({
    availability: true,
  });

  // Get category names
  const categories = await Categorymodel.find().lean();
  const categoryNameMap = {};
  categories.forEach((c) => {
    categoryNameMap[c._id.toString()] = c.name;
  });

  // Build readable lines per category
  const categoryLines = categoryStats.map((stat) => {
    const name = categoryNameMap[stat._id?.toString()] ?? "Uncategorized";
    const subCats = stat.subCategories.filter(Boolean).join(", ");
    return `- ${name} (${stat.count} products, $${stat.minPrice}-$${stat.maxPrice}). Subcategories: ${subCats}`;
  });

  const summaryText = `
STORE CATALOG SNAPSHOT (auto-generated, use search tools for exact details):
Total active products: ${totalProducts}
Products low on stock: ${lowStockCount}
Products out of stock: ${outOfStockCount}

Categories:
${categoryLines.join("\n")}

Note: This is a high-level snapshot. Always use search_products or get_product_details
for specific product names, exact prices, stock levels, or attributes — never guess
specific product details from this summary alone.
`.trim();

  return summaryText;
}
