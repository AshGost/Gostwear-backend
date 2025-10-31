import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// =================== FILE PATH SETUP ===================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =================== FILES ===================
const productsFile = path.join(__dirname, "products.json");
const usersFile = path.join(__dirname, "users.json");

// =================== MIDDLEWARE ===================
app.use(express.json());

// ✅ CORS FIX — Support both local + vercel + preview URLs
const allowedOrigins = [
  "http://localhost:5500",                      // Local testing
  "https://gostwear-frontend.vercel.app",       // Main production
];
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Allow main + subdomains of Vercel automatically
      const isVercelPreview = /\.vercel\.app$/.test(origin);
      if (allowedOrigins.includes(origin) || isVercelPreview) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// =================== DEFAULT ROUTE ===================
app.get("/", (req, res) => {
  res.send("✅ Gostwear Backend is Live and Ready (Render Deployment)");
});

// =================== PRODUCTS API ===================
app.get("/api/products", (req, res) => {
  try {
    if (!fs.existsSync(productsFile)) {
      return res.status(404).json({ error: "Products file not found" });
    }
    const products = JSON.parse(fs.readFileSync(productsFile, "utf-8"));
    res.status(200).json(products);
  } catch (err) {
    console.error("❌ Error reading products:", err);
    res.status(500).json({ error: "Failed to load products" });
  }
});

app.get("/api/products/:id", (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(productsFile, "utf-8"));
    const product = products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("❌ Error reading single product:", err);
    res.status(500).json({ error: "Error loading product data" });
  }
});

// =================== REGISTER ===================
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

  let users = [];
  if (fs.existsSync(usersFile))
    users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));

  if (users.find((u) => u.email === email))
    return res.status(400).json({ error: "User already exists" });

  const newUser = { id: Date.now(), name, email, password };
  users.push(newUser);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  res.json({ message: "Registration successful" });
});

// =================== LOGIN ===================
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "All fields are required" });

  if (!fs.existsSync(usersFile))
    return res.status(400).json({ error: "No users found" });

  const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ message: "Login successful", user });
});

// =================== ORDER (SIMULATION) ===================
app.post("/api/order", (req, res) => {
  console.log("🛒 Order received:", req.body);
  res.json({ message: "Order received successfully" });
});

// =================== STATIC SERVE (optional for future images) ===================
app.use("/public", express.static(path.join(__dirname, "public")));

// =================== SERVER START ===================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
