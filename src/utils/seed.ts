import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";
import Category from "../models/Category";
import AddOn from "../models/AddOn";
import MenuItem from "../models/MenuItem";
import Settings from "../models/Settings";

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seed...\n");

    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("✅ Connected to MongoDB\n");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await Category.deleteMany({});
    await AddOn.deleteMany({});
    await MenuItem.deleteMany({});
    await Settings.deleteMany({});
    console.log("✅ Data cleared\n");

    // Create Users
    console.log("👥 Creating users...");
    const users = await User.create([
      {
        fullName: "System Owner",
        username: "owner",
        pin: "0000",
        role: "owner",
      },
      {
        fullName: "Selam Tesfaye",
        username: "selam",
        pin: "1111",
        role: "waitress",
      },
      {
        fullName: "Hana Bekele",
        username: "hana",
        pin: "1112",
        role: "waitress",
      },
      {
        fullName: "Dawit Kebede",
        username: "kitchen",
        pin: "2222",
        role: "kitchen",
      },
      {
        fullName: "Tigist Alemu",
        username: "juice",
        pin: "3333",
        role: "juicebar",
      },
    ]);
    console.log(`✅ Created ${users.length} users\n`);

    // Create Categories
    console.log("📂 Creating categories...");
    const categories = await Category.create([
      {
        nameEn: "Food",
        nameAm: "ምግብ",
        station: "kitchen",
      },
      {
        nameEn: "Juice",
        nameAm: "ጁስ",
        station: "juicebar",
      },
      {
        nameEn: "Drinks",
        nameAm: "መጠጥ",
        station: "juicebar",
      },
    ]);
    console.log(`✅ Created ${categories.length} categories\n`);

    // Create Add-ons
    console.log("➕ Creating add-ons...");
    const addOns = await AddOn.create([
      { nameEn: "Extra Spicy", nameAm: "በጣም ቅመም", price: 0, cost: 0 },
      { nameEn: "No Onions", nameAm: "ሽንኩርት የለም", price: 0, cost: 0 },
      { nameEn: "Ayib Cheese", nameAm: "አይብ", price: 30, cost: 10 },
      { nameEn: "Extra Injera", nameAm: "ተጨማሪ እንጀራ", price: 20, cost: 5 },
      { nameEn: "Medium Rare", nameAm: "መካከለኛ እሬድ", price: 0, cost: 0 },
      { nameEn: "Extra Ice", nameAm: "ተጨማሪ በረዶ", price: 0, cost: 0 },
    ]);
    console.log(`✅ Created ${addOns.length} add-ons\n`);

    // Get category references
    // Get category references with explicit typing
    const foodCategory = categories.find((c: any) => c.nameEn === "Food")!;
    const juiceCategory = categories.find((c: any) => c.nameEn === "Juice")!;
    const drinksCategory = categories.find((c: any) => c.nameEn === "Drinks")!;
    // Create Menu Items
    console.log("🍽️  Creating menu items...");
    const menuItems = await MenuItem.create([
      // Food Items
      {
        nameEn: "Doro Wot",
        nameAm: "ዶሮ ወጥ",
        price: 250,
        categoryId: foodCategory._id as Types.ObjectId,
        station: "kitchen" as const,
        imageUrl: "https://via.placeholder.com/400x300?text=Doro+Wot",
        addOns: [
          addOns[0]._id,
          addOns[1]._id,
          addOns[3]._id,
        ] as Types.ObjectId[],
        costPerServing: 80,
        inStock: true,
      },
      {
        nameEn: "Kitfo",
        nameAm: "ክትፎ",
        price: 300,
        categoryId: foodCategory._id as Types.ObjectId,
        station: "kitchen" as const,
        imageUrl: "https://via.placeholder.com/400x300?text=Kitfo",
        addOns: [addOns[2]._id, addOns[4]._id] as Types.ObjectId[],
        costPerServing: 120,
        inStock: true,
      },
      {
        nameEn: "Tibs",
        nameAm: "ጥብስ",
        price: 280,
        categoryId: foodCategory._id as Types.ObjectId,
        station: "kitchen" as const,
        imageUrl: "https://via.placeholder.com/400x300?text=Tibs",
        addOns: [addOns[0]._id, addOns[1]._id] as Types.ObjectId[],
        costPerServing: 100,
        inStock: true,
      },
      {
        nameEn: "Shiro",
        nameAm: "ሽሮ",
        price: 120,
        categoryId: foodCategory._id as Types.ObjectId,
        station: "kitchen" as const,
        imageUrl: "https://via.placeholder.com/400x300?text=Shiro",
        addOns: [addOns[0]._id, addOns[3]._id] as Types.ObjectId[],
        costPerServing: 40,
        inStock: true,
      },
      {
        nameEn: "Beyaynetu",
        nameAm: "በያይነቱ",
        price: 180,
        categoryId: foodCategory._id as Types.ObjectId,
        station: "kitchen" as const,
        imageUrl: "https://via.placeholder.com/400x300?text=Beyaynetu",
        addOns: [addOns[3]._id] as Types.ObjectId[],
        costPerServing: 60,
        inStock: true,
      },
      // Juice Items
      {
        nameEn: "Mango Juice",
        nameAm: "ማንጎ ጁስ",
        price: 60,
        categoryId: juiceCategory._id as Types.ObjectId,
        station: "juicebar" as const,
        imageUrl: "https://via.placeholder.com/400x300?text=Mango+Juice",
        addOns: [addOns[5]._id] as Types.ObjectId[],
        costPerServing: 20,
        inStock: true,
      },
      {
        nameEn: "Avocado Juice",
        nameAm: "አቮካዶ ጁስ",
        price: 70,
        categoryId: juiceCategory._id as Types.ObjectId,
        station: "juicebar" as const,
        imageUrl: "https://via.placeholder.com/400x300?text=Avocado+Juice",
        addOns: [addOns[5]._id] as Types.ObjectId[],
        costPerServing: 25,
        inStock: true,
      },
      {
        nameEn: "Mixed Fruit Juice",
        nameAm: "የተቀላቀለ ፍራፍሬ ጁስ",
        price: 80,
        categoryId: juiceCategory._id as Types.ObjectId,
        station: "juicebar" as const,
        imageUrl: "https://via.placeholder.com/400x300?text=Mixed+Juice",
        addOns: [addOns[5]._id] as Types.ObjectId[],
        costPerServing: 30,
        inStock: true,
      },
      // Drinks
      {
        nameEn: "Ethiopian Coffee",
        nameAm: "የኢትዮጵያ ቡና",
        price: 40,
        categoryId: drinksCategory._id as Types.ObjectId,
        station: "juicebar" as const,
        imageUrl: "https://via.placeholder.com/400x300?text=Coffee",
        addOns: [] as Types.ObjectId[],
        costPerServing: 10,
        inStock: true,
      },
      {
        nameEn: "Tej (Honey Wine)",
        nameAm: "ጠጅ",
        price: 150,
        categoryId: drinksCategory._id as Types.ObjectId,
        station: "juicebar" as const,
        imageUrl: "https://via.placeholder.com/400x300?text=Tej",
        addOns: [] as Types.ObjectId[],
        costPerServing: 50,
        inStock: true,
      },
    ]);
    console.log(`✅ Created ${menuItems.length} menu items\n`);

    // Create Settings
    console.log("⚙️  Creating settings...");
    await Settings.create({
      language: "am",
      taxRate: 0.15,
      currency: { en: "$", am: "ብር" },
      nextOrderNumber: 1,
    });
    console.log("✅ Settings created\n");

    console.log("═══════════════════════════════════════");
    console.log("✨ Database Seed Complete!");
    console.log("═══════════════════════════════════════\n");

    console.log("🔐 Test Login Credentials:\n");
    console.log("┌─────────────┬──────────┬─────────┐");
    console.log("│ Role        │ Username │ PIN     │");
    console.log("├─────────────┼──────────┼─────────┤");
    console.log("│ Owner       │ owner    │ 0000    │");
    console.log("│ Waitress    │ selam    │ 1111    │");
    console.log("│ Kitchen     │ kitchen  │ 2222    │");
    console.log("│ Juice Bar   │ juice    │ 3333    │");
    console.log("└─────────────┴──────────┴─────────┘\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
};

seedDatabase();
