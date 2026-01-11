const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offsetNum = (pageNum - 1) * limitNum;

    let query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.email_verified, 
        u.company, u.phone, u.avatar, u.created_at, u.updated_at,
        u.street_address, u.city, u.state, u.zip_code, u.country,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as total_requests
      FROM users u 
      WHERE 1=1
    `;
    let params = [];

    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR company LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    // Use string interpolation for LIMIT and OFFSET (mysql2 prepared statement limitation)
    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limitNum)} OFFSET ${parseInt(offsetNum)}`;

    const [users] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    let countParams = [];

    if (search) {
      countQuery += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR company LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user can access this profile
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [users] = await pool.execute(`
      SELECT 
        id, email, first_name, last_name, role, email_verified,
        company, phone, avatar, created_at, updated_at,
        street_address, city, state, zip_code, country
      FROM users 
      WHERE id = ?
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get user statistics for admins
    if (req.user.role === 'admin') {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
          (SELECT COUNT(*) FROM requests WHERE user_id = ?) as total_requests
        FROM orders 
        WHERE user_id = ?
      `, [id, id]);

      user.statistics = stats[0];
      user.total_requests = stats[0].total_requests || 0;
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, [
  body('email').optional().isEmail().normalizeEmail(),
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('role').optional().isIn(['user', 'moderator', 'admin']),
  body('company').optional().trim(),
  body('phone').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
  body('emailVerified').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { email, firstName, lastName, role, company, phone, status, emailVerified } = req.body;

    // Check if user exists
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateFields = [];
    const updateValues = [];

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (firstName !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(firstName);
    }
    if (lastName !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(lastName);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (company !== undefined) {
      updateFields.push('company = ?');
      updateValues.push(company);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (status !== undefined) {
      // Map status to email_verified (active=true, inactive=false, suspended=false)
      const emailVerifiedValue = status === 'active' ? true : false;
      updateFields.push('email_verified = ?');
      updateValues.push(emailVerifiedValue);
    }
    if (emailVerified !== undefined) {
      updateFields.push('email_verified = ?');
      updateValues.push(emailVerified);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [users] = await pool.execute(`
      SELECT 
        id, email, first_name, last_name, role, email_verified,
        company, phone, avatar, created_at, updated_at,
        street_address, city, state, zip_code, country
      FROM users 
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: users[0] }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user has orders
    const [orders] = await pool.execute('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [id]);
    if (orders[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete user with existing orders' });
    }

    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user dashboard data
router.get('/:id/dashboard', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check access permissions
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user orders
    const [orders] = await pool.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        MAX(created_at) as last_order_date
      FROM orders 
      WHERE user_id = ?
      GROUP BY status
    `, [id]);

    // Get recent activity
    const [recentActivity] = await pool.execute(`
      SELECT 
        'order' as type,
        o.title as description,
        o.created_at,
        o.status
      FROM orders o
      WHERE o.user_id = ?
      UNION ALL
      SELECT 
        'message' as type,
        CONCAT('Message with ', u.first_name, ' ', u.last_name) as description,
        m.created_at,
        NULL as status
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.receiver_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [id, id]);

    // Get notifications
    const [notifications] = await pool.execute(`
      SELECT 
        id,
        title,
        message,
        type,
        resource_type,
        resource_id,
        is_read,
        created_at
      FROM notifications 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [id]);

    const dashboardData = {
      orders: orders.reduce((acc, order) => {
        acc[order.status] = order;
        return acc;
      }, {}),
      recentActivity,
      notifications,
      stats: {
        totalOrders: orders.reduce((sum, order) => sum + order.count, 0),
        unreadNotifications: notifications.filter(n => !n.is_read).length
      }
    };

    res.json({
      success: true,
      data: { dashboard: dashboardData }
    });

  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch user dashboard data' });
  }
});

// Get notifications
router.get('/:id/notifications', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offsetNum = (pageNum - 1) * limitNum;

    // Check access permissions
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = 'SELECT id, title, message, type, resource_type, resource_id, is_read, created_at FROM notifications WHERE user_id = ?';
    let params = [id];

    if (unreadOnly === 'true') {
      query += ' AND is_read = FALSE';
    }

    // Use string interpolation for LIMIT and OFFSET (mysql2 prepared statement limitation)
    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limitNum)} OFFSET ${parseInt(offsetNum)}`;

    const [notifications] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
    let countParams = [id];

    if (unreadOnly === 'true') {
      countQuery += ' AND is_read = FALSE';
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:userId/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { userId, notificationId } = req.params;

    // Check access permissions
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/:userId/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check access permissions
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { updatedCount: result.affectedRows }
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

module.exports = router;