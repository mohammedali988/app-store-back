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
  return results; // returns array of category docs
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

  // Build a name → _id map for easy lookup
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
      sold: randomInt(0, 30),
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

// ── 4. Seed Orders ────────────────────────────────────────────────────────────
async function seedOrders(users, products) {
  console.log("🌱 Seeding orders...");

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
  ];

  const createdOrders = [];

  // Create 2–4 orders per user
  for (const user of users) {
    const orderCount = randomInt(2, 4);

    for (let i = 0; i < orderCount; i++) {
      // Pick 1–3 random products per order
      const itemCount = randomInt(1, 3);
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      const selectedProducts = shuffled.slice(0, itemCount);

      const orderItems = selectedProducts.map((p) => ({
        productId: p._id,
        count: randomInt(1, 3),
      }));

      // Calculate totals
      const totalAmount = orderItems.reduce((sum, item) => sum + item.count, 0);
      const totalprice = selectedProducts.reduce((sum, p, idx) => {
        const discounted = p.price - (p.price * (p.discount || 0)) / 100;
        return sum + discounted * orderItems[idx].count;
      }, 0);

      const order = await orderModel.create({
        userId: user._id,
        orderItem: orderItems,
        totalAmount,
        totalprice: Math.round(totalprice * 100) / 100,
        address: randomFrom(addresses),
        isPaid: Math.random() > 0.3, // 70% paid
      });

      createdOrders.push(order);
    }
  }

  console.log(`   ✅ Created ${createdOrders.length} orders`);
  return createdOrders;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const shouldWipe = args.includes("--fresh"); // pass --fresh to clear existing data

  try {
    await mongoose.connect(process.env.MONGOOSE_URI);
    console.log("✅ Connected to MongoDB\n");

    if (shouldWipe) {
      console.log("🗑️  Wiping existing data...");
      await Promise.all([
        orderModel.deleteMany({}),
        productModel.deleteMany({}),
        Categorymodel.deleteMany({}),
        userModel.deleteMany({ role: "user" }), // keeps existing admins safe
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
    await seedOrders(users, products);

    console.log("\n🎉 Seeding complete!");
    console.log(`   Categories : ${categories.length}`);
    console.log(`   Users      : ${users.length}`);
    console.log(`   Products   : ${products.length}`);
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

main();
