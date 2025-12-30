const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123456', 12);
    await pool.execute(
      `INSERT IGNORE INTO users (email, password, first_name, last_name, role, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['admin@almahbub.com', adminPassword, 'Admin', 'User', 'admin', true]
    );
    console.log('✅ Admin user created');

    // Create sample categories
    const categories = [
      { name: 'Clothing & Apparel', description: 'Professional clothing and fashion items', slug: 'clothing-apparel', image: '/images/categories/clothing.jpg' },
      { name: 'Electronics', description: 'Electronic devices and technology products', slug: 'electronics', image: '/images/categories/electronics.jpg' },
      { name: 'Building Materials', description: 'Construction and building supplies', slug: 'building-materials', image: '/images/categories/building.jpg' },
      { name: 'Accessories', description: 'Various accessories and supplies', slug: 'accessories', image: '/images/categories/accessories.jpg' },
      { name: 'Others', description: 'Other procurement items', slug: 'others', image: '/images/categories/others.jpg' }
    ];

    for (const category of categories) {
      await pool.execute(
        `INSERT IGNORE INTO categories (name, description, slug, image, sort_order) 
         VALUES (?, ?, ?, ?, ?)`,
        [category.name, category.description, category.slug, category.image, 0]
      );
    }
    console.log('✅ Categories created');

    // Get category IDs
    const [categoryRows] = await pool.execute('SELECT id, slug FROM categories');
    const categoryMap = {};
    categoryRows.forEach(cat => {
      categoryMap[cat.slug] = cat.id;
    });

    // Create sample products
    const products = [
      { 
        name: 'Business Suits', 
        description: 'Professional business suits for corporate environments',
        categoryId: categoryMap['clothing-apparel'],
        image: '/images/products/business-suits.jpg',
        specifications: { material: 'Premium wool blend', sizes: 'S-XXL', colors: 'Navy, Black, Grey' }
      },
      { 
        name: 'Laptop Computers', 
        description: 'High-performance laptops for business and personal use',
        categoryId: categoryMap['electronics'],
        image: '/images/products/laptops.jpg',
        specifications: { brands: 'Dell, HP, Lenovo', ram: '8GB-32GB', storage: '256GB-1TB SSD' }
      },
      { 
        name: 'Construction Tools', 
        description: 'Professional construction and building tools',
        categoryId: categoryMap['building-materials'],
        image: '/images/products/tools.jpg',
        specifications: { brands: 'Makita, DeWalt, Bosch', types: 'Power tools, Hand tools' }
      },
      { 
        name: 'Office Supplies', 
        description: 'Essential office supplies and stationery',
        categoryId: categoryMap['accessories'],
        image: '/images/products/office-supplies.jpg',
        specifications: { categories: 'Writing, Filing, Technology, Furniture' }
      }
    ];

    for (const product of products) {
      await pool.execute(
        `INSERT IGNORE INTO products (name, description, category_id, image, specifications) 
         VALUES (?, ?, ?, ?, ?)`,
        [product.name, product.description, product.categoryId, product.image, JSON.stringify(product.specifications)]
      );
    }
    console.log('✅ Products created');

    // Create sample announcements
    const announcements = [
      {
        title: 'Welcome to Almahbub International',
        content: 'We are excited to announce the launch of our new procurement platform. We are here to serve all your procurement needs with the highest quality service.',
        priority: 'high',
        created_by: 1
      },
      {
        title: 'New Electronics Category Added',
        content: 'We have added a new electronics category with various technology products. Browse our latest collection of laptops, smartphones, and accessories.',
        priority: 'medium',
        created_by: 1
      }
    ];

    for (const announcement of announcements) {
      await pool.execute(
        `INSERT IGNORE INTO announcements (title, content, priority, created_by) 
         VALUES (?, ?, ?, ?)`,
        [announcement.title, announcement.content, announcement.priority, announcement.created_by]
      );
    }
    console.log('✅ Announcements created');

    // Create sample FAQs
    const faqs = [
      {
        question: 'How does the procurement process work?',
        answer: 'Our procurement process is simple: 1) Browse our categories, 2) Submit your requirements, 3) Get a quote, 4) Approve and track your order.',
        category: 'General'
      },
      {
        question: 'What types of payments do you accept?',
        answer: 'We accept various payment methods including bank transfers, credit cards, and corporate accounts. Payment terms can be discussed during the quoting process.',
        category: 'Payment'
      },
      {
        question: 'How long does delivery take?',
        answer: 'Delivery times vary depending on the product and quantity. Typically, standard items ship within 3-7 business days, while custom orders may take 2-4 weeks.',
        category: 'Delivery'
      },
      {
        question: 'Do you offer international shipping?',
        answer: 'Yes, we offer international shipping to most countries. Shipping costs and times vary by destination. Contact us for specific international shipping quotes.',
        category: 'Delivery'
      },
      {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for most items in original condition. Custom or made-to-order items may not be returnable. Please contact us for specific return inquiries.',
        category: 'Returns'
      }
    ];

    for (const faq of faqs) {
      await pool.execute(
        `INSERT IGNORE INTO faqs (question, answer, category, sort_order) 
         VALUES (?, ?, ?, ?)`,
        [faq.question, faq.answer, faq.category, 0]
      );
    }
    console.log('✅ FAQs created');

    // Create AI knowledge base
    const aiKnowledge = [
      {
        question: 'hello hi hey greetings',
        answer: 'Hello! 👋 Welcome to Almahbub International! I\'m here to help you with our procurement services. How can I assist you today?',
        confidence: 0.95,
        source: 'manual',
        tags: ['greeting', 'welcome']
      },
      {
        question: 'price cost quote pricing budget',
        answer: '💰 For pricing information, please note that Almahbub operates as a procurement service rather than direct sales. Each request is evaluated individually. You can create an order with your requirements and budget, and our team will provide you with a customized quote. Would you like me to guide you through the ordering process?',
        confidence: 0.90,
        source: 'manual',
        tags: ['pricing', 'quote', 'cost']
      },
      {
        question: 'order status tracking where is my order',
        answer: '📦 To check your order status, please log into your account and visit the \'My Orders\' section. You can also use our real-time tracking feature. If you need specific help with an order, please provide your order number and I\'ll connect you with our team!',
        confidence: 0.88,
        source: 'manual',
        tags: ['order', 'tracking', 'status']
      },
      {
        question: 'delivery shipping when will it arrive timeline',
        answer: '🚚 Delivery timelines vary based on the complexity and quantity of your procurement request. Once your order is approved, we\'ll provide you with an estimated delivery timeline. You can track your order progress in real-time through your account dashboard.',
        confidence: 0.85,
        source: 'manual',
        tags: ['delivery', 'shipping', 'timeline']
      },
      {
        question: 'contact phone email support help',
        answer: '📞 You can reach our team through multiple channels:\n\n• Live chat (like this one!)\n• Email: support@almahbub.com\n• Phone: Available in your account profile\n\nOur team is available Monday-Friday, 9 AM - 6 PM (local time). How else can I help you?',
        confidence: 0.92,
        source: 'manual',
        tags: ['contact', 'support', 'help']
      },
      {
        question: 'services what do you do capabilities what can you help',
        answer: '🌟 Almahbub International specializes in procurement services across multiple categories:\n\n• Clothing & Apparel\n• Electronics & Technology\n• Building Materials\n• Accessories & Supplies\n• Custom Solutions\n\nWe handle everything from sourcing to delivery with quality assurance. What type of procurement are you looking for?',
        confidence: 0.90,
        source: 'manual',
        tags: ['services', 'capabilities', 'categories']
      }
    ];

    for (const knowledge of aiKnowledge) {
      await pool.execute(
        `INSERT IGNORE INTO ai_knowledge (question, answer, confidence_score, source, tags) 
         VALUES (?, ?, ?, ?, ?)`,
        [knowledge.question, knowledge.answer, knowledge.confidence, knowledge.source, JSON.stringify(knowledge.tags)]
      );
    }
    console.log('✅ AI Knowledge base created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📝 Default login credentials:');
    console.log('Admin Email: admin@almahbub.com');
    console.log('Admin Password: admin123456');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;