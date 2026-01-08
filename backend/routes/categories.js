const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const fs = require('fs');
const { createCloudinaryStorage, deleteFile, isCloudinaryConfigured } = require('../config/cloudStorage');

const router = express.Router();

// Configure multer for category image uploads
const categoryStorage = isCloudinaryConfigured() 
  ? createCloudinaryStorage('categories')
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'categories');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

const categoryUpload = multer({
  storage: categoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Helper function to delete old image file
async function deleteCategoryImage(imagePath) {
  if (!imagePath) return;
  
  // For Cloudinary URLs or local paths, use the unified delete function
  if (imagePath.startsWith('/uploads/') || imagePath.includes('cloudinary.com')) {
    await deleteFile(imagePath);
  }
}

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
      WHERE c.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `);

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get subcategories by parent ID
router.get('/parent/:parentId', async (req, res) => {
  try {
    const { parentId } = req.params;

    const [subcategories] = await pool.execute(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
      WHERE c.parent_id = ? AND c.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `, [parentId]);

    // Also get the parent category info
    const [parentCategories] = await pool.execute(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
      WHERE c.id = ?
      GROUP BY c.id
    `, [parentId]);

    res.json({
      success: true,
      data: { 
        subcategories,
        parent: parentCategories[0] || null
      }
    });

  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

// Get single category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [categories] = await pool.execute(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
      WHERE c.id = ? AND c.is_active = TRUE
      GROUP BY c.id
    `, [id]);

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      data: { category: categories[0] }
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Get category by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [categories] = await pool.execute(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
      WHERE c.slug = ? AND c.is_active = TRUE
      GROUP BY c.id
    `, [slug]);

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      data: { category: categories[0] }
    });

  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create category (admin only)
router.post('/', authenticateToken, requireAdmin, categoryUpload.single('image'), [
  body('name').trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('slug').trim().isLength({ min: 1 }),
  body('parent_id').optional().isInt(),
  body('sort_order').optional().isInt(),
  body('icon').optional().trim(),
  body('color').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, slug, parent_id, sort_order = 0, icon, color, status } = req.body;

    // Handle uploaded image - works for both Cloudinary and local storage
    let imagePath = req.body.image || null;
    if (req.file) {
      // Cloudinary returns full URL in req.file.path, local returns file path
      imagePath = req.file.path;
    }

    // Check if slug already exists (in same parent scope)
    let slugCheckQuery = 'SELECT id FROM categories WHERE slug = ?';
    let slugParams = [slug];

    // If creating a subcategory, also check within the same parent
    if (parent_id) {
      slugCheckQuery += ' AND parent_id = ?';
      slugParams.push(parent_id);
    } else {
      slugCheckQuery += ' AND parent_id IS NULL';
    }

    const [existing] = await pool.execute(slugCheckQuery, slugParams);
    if (existing.length > 0) {
      // Delete uploaded file if slug exists
      if (req.file) {
        deleteCategoryImage(imagePath);
      }
      return res.status(400).json({ error: 'Category with this slug already exists' });
    }

    // Convert status to is_active boolean
    const isActive = status === 'active' || status === undefined;

    const [result] = await pool.execute(
      'INSERT INTO categories (name, description, slug, image, parent_id, sort_order, icon, color, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, slug, imagePath, parent_id || null, parseInt(sort_order) || 0, icon || null, color || null, isActive]
    );

    const categoryId = result.insertId;

    const [categories] = await pool.execute('SELECT * FROM categories WHERE id = ?', [categoryId]);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category: categories[0] }
    });

  } catch (error) {
    console.error('Create category error:', error);
    // Delete uploaded file on error
    if (req.file) {
      deleteCategoryImage(imagePath);
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category (admin only)
router.put('/:id', authenticateToken, requireAdmin, categoryUpload.single('image'), [
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('slug').optional().trim().isLength({ min: 1 }),
  body('parent_id').optional().isInt(),
  body('sort_order').optional().isInt(),
  body('icon').optional().trim(),
  body('color').optional().trim(),
  body('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, slug, parent_id, sort_order, icon, color, status, removeImage } = req.body;

    // Get existing category
    const [existing] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      // Delete uploaded file if category doesn't exist
      if (req.file) {
        deleteCategoryImage(req.file.path);
      }
      return res.status(404).json({ error: 'Category not found' });
    }

    const existingCategory = existing[0];
    let imagePath = existingCategory.image;

    // Handle new uploaded image
    if (req.file) {
      // Delete old image if exists
      if (existingCategory.image) {
        await deleteCategoryImage(existingCategory.image);
      }
      // Cloudinary returns full URL, local returns file path
      imagePath = req.file.path;
    }
    // Handle image removal
    else if (removeImage === 'true' || removeImage === true) {
      if (existingCategory.image) {
        await deleteCategoryImage(existingCategory.image);
      }
      imagePath = null;
    }

    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (slug !== undefined) {
      // Check if new slug is already taken by another category (in same parent scope)
      let slugCheckQuery = 'SELECT id FROM categories WHERE slug = ? AND id != ?';
      let slugParams = [slug, id];

      if (parent_id) {
        slugCheckQuery += ' AND parent_id = ?';
        slugParams.push(parent_id);
      } else {
        slugCheckQuery += ' AND parent_id IS NULL';
      }

      const [slugCheck] = await pool.execute(slugCheckQuery, slugParams);
      if (slugCheck.length > 0) {
        return res.status(400).json({ error: 'Category with this slug already exists' });
      }
      updateFields.push('slug = ?');
      updateValues.push(slug);
    }
    if (parent_id !== undefined) {
      updateFields.push('parent_id = ?');
      updateValues.push(parent_id || null);
    }
    // Always update image field if it changed
    if (imagePath !== existingCategory.image) {
      updateFields.push('image = ?');
      updateValues.push(imagePath);
    }
    if (sort_order !== undefined) {
      updateFields.push('sort_order = ?');
      updateValues.push(parseInt(sort_order) || 0);
    }
    if (icon !== undefined) {
      updateFields.push('icon = ?');
      updateValues.push(icon || null);
    }
    if (color !== undefined) {
      updateFields.push('color = ?');
      updateValues.push(color || null);
    }
    if (status !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(status === 'active');
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [categories] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category: categories[0] }
    });

  } catch (error) {
    console.error('Update category error:', error);
    // Delete uploaded file on error
    if (req.file) {
      deleteCategoryImage(`/uploads/categories/${req.file.filename}`);
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const [products] = await pool.execute('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
    if (products[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing products' });
    }

    // Get category to delete associated image
    const [category] = await pool.execute('SELECT image FROM categories WHERE id = ?', [id]);
    if (category.length > 0 && category[0].image) {
      await deleteCategoryImage(category[0].image);
    }

    const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
