// server/seed/seed.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import env from "dotenv";
env.config();

// ── Import your models ────────────────────────────────────────────────────────
import { userModel } from "../model/user.model.js";
import { Categorymodel } from "../model/category.model.js";
import { productModel } from "../model/product.model.js";
import { orderModel } from "../model/orderId.model.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadJSON(filename) {
  return JSON.parse(readFileSync(join(__dirname, "data", filename), "utf-8"));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateInRange(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

function getStatusForDate(orderDate, now) {
  const daysAgo = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
  if (daysAgo > 60) {
    // Old orders: mostly delivered, some cancelled
    const r = Math.random();
    if (r < 0.85) return "delivered";
    if (r < 0.95) return "shipped";
    return "cancelled";
  } else if (daysAgo > 30) {
    // Medium age: mix
    const r = Math.random();
    if (r < 0.5) return "delivered";
    if (r < 0.8) return "shipped";
    if (r < 0.95) return "processing";
    if (r < 0.98) return "pending";
    return "cancelled";
  } else if (daysAgo > 14) {
    // Recent
    const r = Math.random();
    if (r < 0.2) return "delivered";
    if (r < 0.55) return "shipped";
    if (r < 0.85) return "processing";
    if (r < 0.97) return "pending";
    return "cancelled";
  } else {
    // Very recent
    const r = Math.random();
    if (r < 0.05) return "delivered";
    if (r < 0.2) return "shipped";
    if (r < 0.55) return "processing";
    if (r < 0.95) return "pending";
    return "cancelled";
  }
}

function isPaidForStatus(status) {
  if (["delivered", "shipped", "processing"].includes(status)) return true;
  if (status === "pending") return Math.random() > 0.7;
  if (status === "cancelled") return Math.random() > 0.5;
  return false;
}

// ── 1. Seed Categories ────────────────────────────────────────────────────────
async function seedCategories() {
  console.log("🌱 Seeding categories...");
  const data = loadJSON("categories.json");

  const results = [];
  for (const cat of data) {
    const existing = await Categorymodel.findOne({ name: cat.name });
    if (existing) {
      console.log(`   ⚠️  Category "${cat.name}" already exists, skipping.`);
      results.push(existing);
    } else {
      const created = await Categorymodel.create(cat);
      console.log(`   ✅ Created category: ${created.name}`);
      results.push(created);
    }
  }
  return results;
}

// ── 2. Seed Users ─────────────────────────────────────────────────────────────
async function seedUsers() {
  console.log("🌱 Seeding users...");
  const data = loadJSON("users.json");

  const results = [];
  for (const u of data) {
    const existing = await userModel.findOne({ email: u.email });
    if (existing) {
      console.log(`   ⚠️  User "${u.email}" already exists, skipping.`);
      results.push(existing);
    } else {
      const hashed = await bcrypt.hash(u.password, 10);
      const created = await userModel.create({ ...u, password: hashed });
      console.log(`   ✅ Created user: ${created.name}`);
      results.push(created);
    }
  }
  return results;
}

// ── 3. Seed Products ──────────────────────────────────────────────────────────
async function seedProducts(categories) {
  console.log("🌱 Seeding products...");

  const categoryMap = {};
  for (const cat of categories) {
    categoryMap[cat.name] = cat._id;
  }

  const data = loadJSON("products.json");

  const results = [];
  for (const p of data) {
    const existing = await productModel.findOne({ productName: p.productName });
    if (existing) {
      console.log(
        `   ⚠️  Product "${p.productName}" already exists, skipping.`,
      );
      results.push(existing);
      continue;
    }

    const categoryId = categoryMap[p.category];
    if (!categoryId) {
      console.log(
        `   ❌ Category "${p.category}" not found for product "${p.productName}", skipping.`,
      );
      continue;
    }

    const created = await productModel.create({
      productName: p.productName,
      description: p.description,
      price: p.price,
      discount: p.discount,
      stock: p.stock ?? {
        value: randomInt(10, 100),
        unit: "units",
        lowStockThreshold: 5,
      },
      sold: randomInt(0, 50),
      availability: true,
      productImages: p.productImages,
      category: categoryId,
      subCategory: p.subCategory,
      attributes: p.attributes,
    });
    console.log(`   ✅ Created product: ${created.productName}`);
    results.push(created);
  }
  return results;
}

// ── 4. Seed Orders with Realistic Timestamps ─────────────────────────────────
async function seedOrders(users, products) {
  console.log("🌱 Seeding orders with realistic timestamps...");

  const addresses = [
    {
      state: "Ramallah",
      street: "Al-Bireh St",
      description: "Near the main roundabout",
    },
    {
      state: "Nablus",
      street: "Al-Midan St",
      description: "Next to the old city",
    },
    {
      state: "Hebron",
      street: "King David St",
      description: "Opposite the mosque",
    },
    {
      state: "Jenin",
      street: "Al-Quds St",
      description: "Behind the hospital",
    },
    { state: "Bethlehem", street: "Manger St", description: "Near the church" },
    { state: "Gaza", street: "Omar Mukhtar St", description: "Near the port" },
    { state: "Tulkarm", street: "Al-Ittihad St", description: "City center" },
    {
      state: "Jericho",
      street: "Al-Nakheel St",
      description: "Near the oasis",
    },
  ];

  const now = new Date();
  const startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 12 months ago

  const createdOrders = [];
  let orderCount = 0;

  // Generate orders day by day for realistic distribution
  const currentDate = new Date(startDate);

  while (currentDate <= now) {
    const month = currentDate.getMonth(); // 0-11
    const dayOfWeek = currentDate.getDay(); // 0=Sun, 6=Sat

    // Weekend multiplier (Fri-Sun boost)
    const weekendMultiplier =
      dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 ? 1.6 : 1.0;

    // Monthly seasonality weights
    const monthlyWeights = [
      0.7, 0.8, 1.0, 1.05, 1.1, 1.15, 0.9, 0.85, 1.0, 1.1, 1.4, 1.5,
    ];
    const monthWeight = monthlyWeights[month];

    // Growth trend: more recent = more orders (30% growth over year)
    const daysFromStart = (currentDate - startDate) / (1000 * 60 * 60 * 24);
    const growthFactor = 1 + (daysFromStart / 365) * 0.3;

    // Base daily orders
    const baseDaily = 1.0;
    const dailyTarget =
      baseDaily * weekendMultiplier * monthWeight * growthFactor;
    const numOrders = Math.max(
      0,
      Math.round(dailyTarget + (Math.random() - 0.5) * 1.5),
    );

    for (let i = 0; i < numOrders; i++) {
      // Random time during day (peak hours 10am-8pm)
      const hourWeights = [
        1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 7, 8, 9, 8, 7, 5, 3, 2,
      ];
      let hour = 0;
      const hourRand = Math.random() * hourWeights.reduce((a, b) => a + b, 0);
      let cum = 0;
      for (let h = 0; h < 24; h++) {
        cum += hourWeights[h];
        if (hourRand <= cum) {
          hour = h;
          break;
        }
      }
      const minute = randomInt(0, 59);
      const second = randomInt(0, 59);

      const orderTime = new Date(currentDate);
      orderTime.setHours(hour, minute, second, 0);

      // Pick random user (weighted by activity)
      const userWeights = users.map(() => 0.5 + Math.random());
      const totalWeight = userWeights.reduce((a, b) => a + b, 0);
      let userRand = Math.random() * totalWeight;
      let userIndex = 0;
      for (let ui = 0; ui < users.length; ui++) {
        userRand -= userWeights[ui];
        if (userRand <= 0) {
          userIndex = ui;
          break;
        }
      }
      const user = users[userIndex];

      // Pick 1-4 products per order
      const itemCountDist = [0.45, 0.35, 0.15, 0.05];
      let itemRand = Math.random();
      let itemCount = 1;
      if (itemRand < itemCountDist[0]) itemCount = 1;
      else if (itemRand < itemCountDist[0] + itemCountDist[1]) itemCount = 2;
      else if (
        itemRand <
        itemCountDist[0] + itemCountDist[1] + itemCountDist[2]
      )
        itemCount = 3;
      else itemCount = 4;

      const shuffled = [...products].sort(() => 0.5 - Math.random());
      const selectedProducts = shuffled.slice(0, itemCount);

      const orderItems = selectedProducts.map((p) => {
        const count = randomInt(1, 3);
        return {
          productId: p._id,
          count: count,
        };
      });

      // Calculate totals from actual product prices
      let totalAmount = 0;
      let totalprice = 0;
      for (let idx = 0; idx < selectedProducts.length; idx++) {
        const p = selectedProducts[idx];
        const count = orderItems[idx].count;
        const discounted = p.price - (p.price * (p.discount || 0)) / 100;
        totalAmount += count;
        totalprice += discounted * count;
      }

      const status = getStatusForDate(orderTime, now);
      const isPaid = isPaidForStatus(status);

      const order = await orderModel.create({
        userId: user._id,
        orderItem: orderItems,
        totalAmount,
        totalprice: Math.round(totalprice * 100) / 100,
        address: randomFrom(addresses),
        isPaid,
        status,
        createdAt: orderTime,
        updatedAt: orderTime,
      });

      createdOrders.push(order);
      orderCount++;
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`   ✅ Created ${orderCount} orders`);
  return createdOrders;
}

// ── 5. Analytics Summary ─────────────────────────────────────────────────────
async function printAnalytics(orders) {
  console.log("\n📊 Revenue Analytics Summary:");

  // Group by month
  const monthly = {};
  for (const o of orders) {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthly[key]) monthly[key] = { orders: 0, revenue: 0 };
    monthly[key].orders++;
    monthly[key].revenue += o.totalprice;
  }

  const sortedMonths = Object.keys(monthly).sort();
  console.log("\n   Monthly Breakdown:");
  for (const m of sortedMonths) {
    console.log(
      `     ${m}: ${monthly[m].orders} orders, $${monthly[m].revenue.toFixed(2)} revenue`,
    );
  }

  // Status distribution
  const statusCounts = {};
  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  }
  console.log("\n   Status Distribution:");
  for (const [s, c] of Object.entries(statusCounts)) {
    console.log(`     ${s}: ${c} (${((c / orders.length) * 100).toFixed(1)}%)`);
  }

  // Total stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalprice, 0);
  const avgOrderValue = totalRevenue / orders.length;
  const totalUnits = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  console.log(`\n   Total Orders: ${orders.length}`);
  console.log(`   Total Revenue: $${totalRevenue.toFixed(2)}`);
  console.log(`   Average Order Value: $${avgOrderValue.toFixed(2)}`);
  console.log(`   Total Units Sold: ${totalUnits}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const shouldWipe = args.includes("--fresh");

  try {
    await mongoose.connect(process.env.MONGOOSE_URI);
    console.log("✅ Connected to MongoDB\n");

    if (shouldWipe) {
      console.log("🗑️  Wiping existing data...");
      await Promise.all([
        orderModel.deleteMany({}),
        productModel.deleteMany({}),
        Categorymodel.deleteMany({}),
        userModel.deleteMany({ role: "user" }),
      ]);
      console.log(
        "   ✅ Cleared orders, products, categories, and non-admin users\n",
      );
    }

    // Order matters: categories → users → products → orders
    const categories = await seedCategories();
    console.log();
    const users = await seedUsers();
    console.log();
    const products = await seedProducts(categories);
    console.log();
    const orders = await seedOrders(users, products);

    console.log("\n🎉 Seeding complete!");
    console.log(`   Categories : ${categories.length}`);
    console.log(`   Users      : ${users.length}`);
    console.log(`   Products   : ${products.length}`);
    console.log(`   Orders     : ${orders.length}`);

    await printAnalytics(orders);
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

main();
