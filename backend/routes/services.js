const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all services
router.get('/', async (req, res) => {
  try {
    const [services] = await pool.execute(`
      SELECT 
        s.*,
        COUNT(DISTINCT o.id) as order_count
      FROM services s
      LEFT JOIN orders o ON s.id = o.service_id
      WHERE s.is_active = TRUE
      GROUP BY s.id
      ORDER BY s.sort_order ASC, s.name ASC
    `);

    res.json({
      success: true,
      data: { services }
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get single service
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [services] = await pool.execute(`
      SELECT 
        s.*,
        COUNT(DISTINCT o.id) as order_count
      FROM services s
      LEFT JOIN orders o ON s.id = o.service_id
      WHERE s.id = ? AND s.is_active = TRUE
      GROUP BY s.id
    `, [id]);

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      success: true,
      data: { service: services[0] }
    });

  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Create service (admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('name').trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('image').optional().trim(),
  body('sortOrder').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, image, sortOrder = 0 } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO services (name, description, image, sort_order) VALUES (?, ?, ?, ?)',
      [name, description, image, sortOrder]
    );

    const serviceId = result.insertId;

    const [services] = await pool.execute('SELECT * FROM services WHERE id = ?', [serviceId]);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { service: services[0] }
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update service (admin only)
router.put('/:id', authenticateToken, requireAdmin, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('image').optional().trim(),
  body('sortOrder').optional().isInt(),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, image, sortOrder, isActive } = req.body;

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
    if (image !== undefined) {
      updateFields.push('image = ?');
      updateValues.push(image);
    }
    if (sortOrder !== undefined) {
      updateFields.push('sort_order = ?');
      updateValues.push(sortOrder);
    }
    if (isActive !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(isActive);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE services SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [services] = await pool.execute('SELECT * FROM services WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: { service: services[0] }
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service has orders
    const [orders] = await pool.execute('SELECT COUNT(*) as count FROM orders WHERE service_id = ?', [id]);
    if (orders[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete service with existing orders' });
    }

    const [result] = await pool.execute('DELETE FROM services WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

module.exports = router;