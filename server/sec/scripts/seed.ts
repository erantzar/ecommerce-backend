import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import connectDB from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import User from "../features/users/user.model.js";
import Product from "../features/products/products.model.js";

// ─── Image helpers ────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// seed.ts is at server/sec/scripts/ → three levels up → E-Commerce-Backend/
const IMAGES_DIR = path.join(__dirname, "../../../Products Images");

/** Strip characters that can't appear in filenames (e.g. the `"` in `4K Smart TV 55"`) */
function sanitizeName(name: string): string {
  return name.replace(/["\\/]/g, "").trim();
}

/** Return sorted absolute paths of every image that belongs to this product. */
function getImagePaths(productName: string): string[] {
  const safe = sanitizeName(productName);
  let files: string[] = [];
  try {
    files = fs.readdirSync(IMAGES_DIR);
  } catch {
    console.warn(`  ⚠ Images folder not found: ${IMAGES_DIR}`);
    return [];
  }
  return files
    .filter((f) => f.startsWith(safe + "-") || f.startsWith(safe + "."))
    .sort()
    .map((f) => path.join(IMAGES_DIR, f));
}

/** Upload a single local file to Cloudinary and return its secure URL. */
async function uploadImage(filePath: string): Promise<string> {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "ecommerce/products",
    transformation: [
      { width: 800, height: 800, crop: "fill", gravity: "auto" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
  });
  return result.secure_url;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const ADMIN = [{email: "eran.tzar@gmail.com", password: "Test1234" },
               {email: "ben.somthing@gmail.com", password: "Test1234" }
];
const CUSTOMER_PASSWORD = "Customer1234";

const customers = [
  { name: "Alice Brown",   email: "alice@store.com" },
  { name: "Bob Smith",     email: "bob@store.com" },
  { name: "Carol White",   email: "carol@store.com" },
  { name: "David Lee",     email: "david@store.com" },
  { name: "Eva Martinez",  email: "eva@store.com" },
  { name: "Frank Chen",    email: "frank@store.com" },
  { name: "Grace Kim",     email: "grace@store.com" },
  { name: "Henry Taylor",  email: "henry@store.com" },
  { name: "Iris Johnson",  email: "iris@store.com" },
];

const products = [
  // electronics (4)
  { name: "Wireless Noise-Cancelling Headphones", description: "Over-ear headphones with 30-hour battery life and premium sound quality.", price: 149.99, category: "electronics", stock: 45 },
  { name: "4K Smart TV 55\"", description: "Ultra HD display with built-in streaming apps and voice control.", price: 599.99, category: "electronics", stock: 20 },
  { name: "Bluetooth Mechanical Keyboard", description: "Compact 75% layout with RGB backlighting and tactile switches.", price: 89.99, category: "electronics", stock: 60 },
  { name: "Portable Power Bank 20000mAh", description: "Fast-charge power bank with dual USB-C ports for phones and laptops.", price: 49.99, category: "electronics", stock: 80 },

  // clothing (4)
  { name: "Classic Denim Jacket", description: "Timeless medium-wash denim jacket with a relaxed fit, suitable for all seasons.", price: 69.99, category: "clothing", stock: 35 },
  { name: "Men's Running Shoes", description: "Lightweight mesh sneakers with responsive cushioning for daily runs.", price: 84.99, category: "clothing", stock: 50 },
  { name: "Women's Floral Wrap Dress", description: "Flowy midi dress in a vibrant floral print, perfect for summer occasions.", price: 44.99, category: "clothing", stock: 40 },
  { name: "Merino Wool Beanie", description: "Soft and warm beanie knitted from 100% merino wool in a one-size-fits-all design.", price: 24.99, category: "clothing", stock: 75 },

  // food (4)
  { name: "Organic Cold-Brew Coffee Pack", description: "12-pack of ready-to-drink cold-brew coffee, lightly sweetened, made from organic beans.", price: 29.99, category: "food", stock: 100 },
  { name: "Artisan Dark Chocolate Box", description: "Assorted 70% cacao dark chocolate truffles, handcrafted in small batches.", price: 18.99, category: "food", stock: 90 },
  { name: "Mixed Nut & Dried Fruit Snack Set", description: "Six premium snack pouches of nuts, seeds, and naturally dried fruits with no added sugar.", price: 22.99, category: "food", stock: 85 },
  { name: "Extra Virgin Olive Oil 1L", description: "First cold-pressed Greek olive oil with rich fruity flavour and low acidity.", price: 16.99, category: "food", stock: 70 },

  // home (4)
  { name: "Bamboo Cutting Board Set", description: "Set of three eco-friendly bamboo cutting boards in graduated sizes with juice grooves.", price: 34.99, category: "home", stock: 55 },
  { name: "Scented Soy Candle Collection", description: "Set of four hand-poured soy candles in lavender, vanilla, cedar, and citrus scents.", price: 42.99, category: "home", stock: 65 },
  { name: "Adjustable Standing Desk Lamp", description: "LED desk lamp with 5 brightness levels, USB-A charging port, and flexible gooseneck arm.", price: 38.99, category: "home", stock: 48 },
  { name: "Linen Throw Pillow Set", description: "Set of two 45 × 45 cm stonewashed linen pillow covers in natural beige.", price: 27.99, category: "home", stock: 42 },

  // beauty (4)
  { name: "Hyaluronic Acid Face Serum 30ml", description: "Lightweight hydrating serum with 2% pure hyaluronic acid for plump, dewy skin.", price: 26.99, category: "beauty", stock: 95 },
  { name: "Vitamin C Brightening Moisturiser", description: "Daily SPF 30 moisturiser with stabilised vitamin C to even skin tone and protect against UV.", price: 31.99, category: "beauty", stock: 78 },
  { name: "Natural Bristle Hair Brush", description: "Boar and nylon mixed bristle paddle brush that detangles, smooths, and adds shine.", price: 19.99, category: "beauty", stock: 60 },
  { name: "Lip Care Gift Set", description: "Six flavoured beeswax lip balms in a reusable tin — SPF 15 formula, long-lasting moisture.", price: 14.99, category: "beauty", stock: 110 },
];

// ─── Seed function ────────────────────────────────────────────────────────────

async function seed() {
  await connectDB();

  await User.deleteMany({});
  await Product.deleteMany({});

  const adminHash = await bcrypt.hash(ADMIN[0].password, 10);
  const customerHash = await bcrypt.hash(CUSTOMER_PASSWORD, 10);

  await User.create({
    name: "Admin User",
    email: ADMIN[0].email,
    password: adminHash,
    role: "admin",
    isVerified: false,
  });

  await User.create({
    name: "Ben",
    email: ADMIN[1].email,
    password: adminHash,
    role: "admin",
    isVerified: false,
  });

  await User.insertMany(
    customers.map((c) => ({
      ...c,
      password: customerHash,
      role: "customer",
      isVerified: true,
    }))
  );

  // Upload images to Cloudinary then insert products
  console.log("Uploading product images to Cloudinary…");
  const productsWithImages = await Promise.all(
    products.map(async (p) => {
      const imagePaths = getImagePaths(p.name);
      const images: string[] = [];
      for (const fp of imagePaths) {
        try {
          images.push(await uploadImage(fp));
        } catch (err) {
          console.warn(`  ⚠ Could not upload ${path.basename(fp)}:`, err);
        }
      }
      console.log(`  ✓ ${p.name} — ${images.length} image(s)`);
      return { ...p, images };
    })
  );

  await Product.insertMany(productsWithImages);

  console.log("");
  console.log("✓ 10 users inserted");
  console.log("✓ 20 products inserted (with images)");
  console.log("");
  console.log("Admin credentials:");
  console.log(`  email:    ${ADMIN[0].email}`);
  console.log(`  password: ${ADMIN[0].password}`);
  console.log(`  email:    ${ADMIN[1].email}`);
  console.log(`  password: ${ADMIN[1].password}`);
  console.log("");
  console.log("Customer credentials (all 9 customers):");
  console.log(`  password: ${CUSTOMER_PASSWORD}`);
  customers.forEach((c) => console.log(`  ${c.email}`));

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
