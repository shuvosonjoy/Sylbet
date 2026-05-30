import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Category = require('./models/Category.js');
const Subcategory = require('./models/Subcategory.js');
const Product = require('./models/Product.js');
const User = require('./models/User.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sylbets');
    console.log('MongoDB Connected for Seeding');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Ensure admin user exists
    const adminExists = await User.findOne({ email: 'admin@sylbets.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@sylbets.com',
        password: 'sylbets2024',
        role: 'admin'
      });
      console.log('Admin user created (admin@sylbets.com / sylbets2024)');
    } else {
      console.log('Admin user already exists');
    }

    // Check if db is already seeded
    const existingCategories = await Category.countDocuments();

    if (existingCategories > 0) {
      console.log('Database already contains data. Skipping seed.');
      process.exit();
    }

    console.log('Seeding Database...');

    // Clear existing
    await Category.deleteMany();
    await Subcategory.deleteMany();
    await Product.deleteMany();

    // Create Categories
    const categories = await Category.insertMany([
      { name: 'Sittings', description: 'Handcrafted cane chairs and seating for indoor and outdoor use.' },
      { name: 'Tables', description: 'Elegant cane and glass tables.' },
      { name: 'Storage & Baskets', description: 'Functional and beautiful woven baskets.' },
      { name: 'Lamps & Lighting', description: 'Warm, natural lighting solutions.' },
      { name: 'Wall Decor', description: 'Artistic woven wall pieces.' },
      { name: 'Mirrors', description: 'Mirrors with intricate cane frames.' }
    ]);
    console.log('Categories created');

    const getCatId = (name) => categories.find(c => c.name === name)._id;

    // Create Subcategories
    const subcategories = await Subcategory.insertMany([
      { name: 'Chairs', category: getCatId('Sittings'), description: 'Classic and modern cane chairs' },
      { name: 'Lounge Chairs', category: getCatId('Sittings'), description: 'Relaxing lounge seating' },
      { name: 'Stools', category: getCatId('Sittings'), description: 'Cane bar and counter stools' },
      { name: 'Coffee Tables', category: getCatId('Tables'), description: 'Round and square coffee tables' },
      { name: 'Side Tables', category: getCatId('Tables'), description: 'Compact side and accent tables' },
      { name: 'Laundry Baskets', category: getCatId('Storage & Baskets'), description: 'Woven laundry hampers' },
      { name: 'Decorative Baskets', category: getCatId('Storage & Baskets'), description: 'Multi-purpose decorative storage' },
      { name: 'Pendant Lights', category: getCatId('Lamps & Lighting'), description: 'Hanging pendant lampshades' },
      { name: 'Table Lamps', category: getCatId('Lamps & Lighting'), description: 'Desk and bedside lamps' },
      { name: 'Wall Mirrors', category: getCatId('Mirrors'), description: 'Decorative wall mirrors' },
      { name: 'Wall Plates', category: getCatId('Wall Decor'), description: 'Woven wall plate sets' },
    ]);
    console.log('Subcategories created');

    const getSubId = (name) => subcategories.find(s => s.name === name)._id;

    // Create Products
    const products = [
      {
        name: 'Classic Rattan Lounge Chair',
        price: 8500,
        discountPrice: 6999,
        description: 'A beautifully curved rattan lounge chair perfect for your living room or reading nook. Includes a comfortable white cushion.',
        category: getCatId('Sittings'),
        subcategory: getSubId('Lounge Chairs'),
        stock: 10,
        featured: true,
        bestSelling: true
      },
      {
        name: 'Woven Cane Dining Chair',
        price: 4500,
        description: 'Sturdy dining chair featuring a cane backrest and wooden frame. Brings a natural touch to your dining area.',
        category: getCatId('Sittings'),
        subcategory: getSubId('Chairs'),
        stock: 24,
        featured: false,
        bestSelling: true
      },
      {
        name: 'Round Cane Coffee Table',
        price: 12000,
        discountPrice: 9500,
        description: 'A center table featuring a woven cane shelf and a tempered glass top.',
        category: getCatId('Tables'),
        subcategory: getSubId('Coffee Tables'),
        stock: 5,
        featured: true,
        bestSelling: true
      },
      {
        name: 'Boho Cane Side Table',
        price: 3500,
        description: 'A compact side table perfect for holding a lamp or your morning coffee.',
        category: getCatId('Tables'),
        subcategory: getSubId('Side Tables'),
        stock: 15,
        featured: false
      },
      {
        name: 'Large Woven Laundry Basket',
        price: 2800,
        discountPrice: 2200,
        description: 'Tall, sturdy basket with a lid and cotton lining. Perfect for laundry or storing extra blankets.',
        category: getCatId('Storage & Baskets'),
        subcategory: getSubId('Laundry Baskets'),
        stock: 20,
        featured: true
      },
      {
        name: 'Set of 3 Nesting Baskets',
        price: 3200,
        description: 'Versatile storage baskets in three different sizes. Great for organizing shelves.',
        category: getCatId('Storage & Baskets'),
        subcategory: getSubId('Decorative Baskets'),
        stock: 30,
        featured: false,
        bestSelling: true
      },
      {
        name: 'Bamboo & Cane Pendant Light',
        price: 4800,
        description: 'A stunning pendant lampshade that casts beautiful warm shadows across the room.',
        category: getCatId('Lamps & Lighting'),
        subcategory: getSubId('Pendant Lights'),
        stock: 8,
        featured: true,
        bestSelling: true
      },
      {
        name: 'Cane Table Lamp',
        price: 3500,
        discountPrice: 2800,
        description: 'A cylindrical table lamp providing soft, ambient light for your bedroom.',
        category: getCatId('Lamps & Lighting'),
        subcategory: getSubId('Table Lamps'),
        stock: 12,
        featured: false
      },
      {
        name: 'Sunburst Cane Mirror',
        price: 5500,
        description: 'A striking statement mirror with a sunburst design made from natural cane.',
        category: getCatId('Mirrors'),
        subcategory: getSubId('Wall Mirrors'),
        stock: 6,
        featured: true,
        bestSelling: true
      },
      {
        name: 'Oval Rattan Wall Mirror',
        price: 4200,
        discountPrice: 3500,
        description: 'Simple and elegant oval mirror with a thick rattan border.',
        category: getCatId('Mirrors'),
        subcategory: getSubId('Wall Mirrors'),
        stock: 10,
        featured: false
      },
      {
        name: 'Woven Wall Plate Set',
        price: 3000,
        description: 'A set of 5 decorative woven plates in varying patterns and sizes for your wall.',
        category: getCatId('Wall Decor'),
        subcategory: getSubId('Wall Plates'),
        stock: 15,
        featured: true
      },
      {
        name: 'Cane Planter Stand',
        price: 2500,
        discountPrice: 1999,
        description: 'An elevated stand for your indoor plants, adding height and texture to your space.',
        category: getCatId('Storage & Baskets'),
        subcategory: getSubId('Decorative Baskets'),
        stock: 18,
        featured: false
      }
    ];

    await Product.insertMany(products);
    console.log('Products created');

    console.log('Seeding Complete!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
