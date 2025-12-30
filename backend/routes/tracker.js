const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Create tracking entry
router.post('/', authenticateToken, requireAdmin, [
  body('orderId').isInt(),
  body('status').trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('location').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, status, description, location } = req.body;

    // Verify order exists
    const [orders] = await pool.execute('SELECT id FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const [result] = await pool.execute(
      'INSERT INTO order_tracking (order_id, status, description, location, created_by) VALUES (?, ?, ?, ?, ?)',
      [orderId, status, description, location, req.user.id]
    );

    const trackingId = result.insertId;

    // Get created tracking entry
    const [tracking] = await pool.execute(`
      SELECT 
        ot.*,
        u.first_name,
        u.last_name
      FROM order_tracking ot
      LEFT JOIN users u ON ot.created_by = u.id
      WHERE ot.id = ?
    `, [trackingId]);

    res.status(201).json({
      success: true,
      message: 'Tracking entry created successfully',
      data: { tracking: tracking[0] }
    });

  } catch (error) {
    console.error('Create tracking error:', error);
    res.status(500).json({ error: 'Failed to create tracking entry' });
  }
});

// Get all tracking entries
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [tracking] = await pool.execute(`
      SELECT 
        ot.*,
        o.title as order_title,
        o.status as order_status,
        u.first_name,
        u.last_name,
        creator.first_name as creator_first_name,
        creator.last_name as creator_last_name
      FROM order_tracking ot
      LEFT JOIN orders o ON ot.order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users creator ON ot.created_by = creator.id
      ORDER BY ot.created_at DESC
    `);

    res.json({
      success: true,
      data: { tracking }
    });

  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({ error: 'Failed to fetch tracking entries' });
  }
});

// Get tracking for specific order
router.get('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Verify order access
    const [orders] = await pool.execute('SELECT user_id FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (req.user.role !== 'admin' && req.user.id !== orders[0].user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [tracking] = await pool.execute(`
      SELECT 
        ot.*,
        u.first_name,
        u.last_name
      FROM order_tracking ot
      LEFT JOIN users u ON ot.created_by = u.id
      WHERE ot.order_id = ?
      ORDER BY ot.created_at ASC
    `, [orderId]);

    res.json({
      success: true,
      data: { tracking }
    });

  } catch (error) {
    console.error('Get order tracking error:', error);
    res.status(500).json({ error: 'Failed to fetch order tracking' });
  }
});

// Update tracking entry
router.put('/:id', authenticateToken, requireAdmin, [
  body('status').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('location').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, description, location } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE order_tracking SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated tracking entry
    const [tracking] = await pool.execute(`
      SELECT 
        ot.*,
        o.title as order_title,
        u.first_name,
        u.last_name
      FROM order_tracking ot
      LEFT JOIN orders o ON ot.order_id = o.id
      LEFT JOIN users u ON ot.created_by = u.id
      WHERE ot.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Tracking entry updated successfully',
      data: { tracking: tracking[0] }
    });

  } catch (error) {
    console.error('Update tracking error:', error);
    res.status(500).json({ error: 'Failed to update tracking entry' });
  }
});

// Delete tracking entry
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM order_tracking WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tracking entry not found' });
    }

    res.json({
      success: true,
      message: 'Tracking entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete tracking error:', error);
    res.status(500).json({ error: 'Failed to delete tracking entry' });
  }
});

module.exports = router;