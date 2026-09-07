const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin, requireVerified } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/orders/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'order-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and document files are allowed'));
    }
  }
});

// Create new order
router.post('/', authenticateToken, requireVerified, upload.array('files', 5), [
  body('title').trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('productId').optional().isInt(),
  body('quantity').optional().isInt({ min: 1 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('deliveryStreet').optional().trim(),
  body('deliveryCity').optional().trim(),
  body('deliveryState').optional().trim(),
  body('deliveryZipCode').optional().trim(),
  body('deliveryCountry').optional().trim(),
  body('budgetCurrency').optional().trim(),
  body('budgetAmount').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, productId, quantity = 1 } = req.body;
    const files = req.files || [];

    // Process uploaded files
    const fileUrls = files.map(file => ({
      filename: file.originalname,
      url: `/uploads/orders/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    // Generate user-specific request number (REQ-0001, REQ-0002, etc. per user)
    const [userRequestCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
      [req.user.id]
    );
    const nextRequestNumber = (userRequestCount[0].count + 1).toString().padStart(4, '0');
    const requestNumber = `REQ-${nextRequestNumber}`;

    // Create order with user-specific request number
    const [result] = await pool.execute(
      `INSERT INTO orders (user_id, request_number, product_id, title, description, quantity, files, delivery_street, delivery_city, delivery_state, delivery_zipcode, delivery_country, budget_currency, budget_amount, priority) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, requestNumber, productId || null, title, description, quantity, JSON.stringify(fileUrls), req.body.deliveryStreet || '', req.body.deliveryCity || '', req.body.deliveryState || '', req.body.deliveryZipCode || '', req.body.deliveryCountry || '', req.body.budgetCurrency || 'NGN', req.body.budgetAmount || null, req.body.priority || 'medium']
    );

    const orderId = result.insertId;

    // Get created order with user details
    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.company,
        u.street_address,
        u.city,
        u.state,
        u.zip_code,
        u.country,
        p.name as product_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `, [orderId]);

    const order = orders[0];

    // Create notification for admins
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type, data) VALUES (?, ?, ?, ?, ?)',
      [1, 'New Order Received', `New order: ${title}`, 'order_update', JSON.stringify({ orderId, userId: req.user.id })]
    );

    // Send email notification to admins (you might want to get all admin emails)
    const [admins] = await pool.execute('SELECT email, first_name, last_name FROM users WHERE role = "admin"');
    for (const admin of admins) {
      try {
        // In a real app, you'd send to the admin
        console.log(`Would send new order notification to ${admin.email}`);
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get all orders (admin) or user orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.company,
        u.street_address,
        u.city,
        u.state,
        u.zip_code,
        u.country,
        p.name as product_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
    `;
    let params = [];

    if (req.user.role !== 'admin') {
      query += ' WHERE o.user_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY o.created_at DESC';

    const [orders] = await pool.execute(query, params);

    res.json({
      success: true,
      data: { orders }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get user's orders
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user can access these orders
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.company,
        u.street_address,
        u.city,
        u.state,
        u.zip_code,
        u.country,
        p.name as product_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: { orders }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.company,
        u.street_address,
        u.city,
        u.state,
        u.zip_code,
        u.country,
        p.name as product_name,
        p.description as product_description
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Check if user can access this order
    if (req.user.role !== 'admin' && req.user.id !== order.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Transform order data to match frontend expectations
    const requestData = {
      id: order.id,
      requestNumber: order.request_number || `REQ-${order.id.toString().padStart(6, '0')}`,
      status: order.status || 'received',
      totalAmount: 0,
      currency: order.currency || 'USD',
      subtotal: 0,
      tax: 0,
      items: [
        {
          id: 1,
          productId: order.product_id || 1,
          productName: order.product_name || order.title || 'Procurement Item',
          description: order.description || order.product_description || 'Procurement request item',
          specifications: order.specifications || 'Custom specifications',
          quantity: order.quantity || 1,
          unitPrice: 0,
          totalPrice: 0,
          category: order.category || 'General Procurement'
        }
      ],
      deliveryAddress: {
        fullName: `${order.first_name} ${order.last_name}`,
        companyName: order.company || '',
        street: order.delivery_street || order.street_address || 'Address to be provided',
        city: order.delivery_city || order.city || 'City',
        state: order.delivery_state || order.state || 'State',
        zipCode: order.delivery_zipcode || order.zip_code || '00000',
        country: order.delivery_country || order.country || 'Country',
        phone: order.phone || ''
      },
      user: {
        id: order.user_id,
        firstName: order.first_name,
        lastName: order.last_name,
        email: order.email,
        phone: order.phone || '',
        company: order.company || '',
        address: {
          street: order.street_address || '',
          city: order.city || '',
          state: order.state || '',
          zipCode: order.zip_code || '',
          country: order.country || ''
        }
      },
      paymentMethod: order.payment_method || 'Quote-based',
      paymentStatus: 'pending',
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      description: order.description || 'Procurement request',
      priority: order.priority || 'medium',
      expectedDeliveryDate: order.expected_delivery_date,
      specialInstructions: order.special_instructions,
      assignedTo: order.assigned_to,
      notes: order.admin_notes,
      // Include original order data
      _order: order
    };

    res.json({
      success: true,
      data: { order: requestData }
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order (admin only)
router.put('/:id', authenticateToken, requireAdmin, [
  body('status').optional().isIn(['pending', 'received', 'reviewing', 'discussion', 'sourcing', 'processing', 'approved', 'rejected', 'completed', 'cancelled']),
  body('adminNotes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // Check if order exists
    const [existingOrders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (existingOrders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const oldOrder = existingOrders[0];
    const updateFields = [];
    const updateValues = [];

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (adminNotes !== undefined) {
      updateFields.push('admin_notes = ?');
      updateValues.push(adminNotes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated order
    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.company,
        u.street_address,
        u.city,
        u.state,
        u.zip_code,
        u.country
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

    const updatedOrder = orders[0];

    // Send email notification if status changed
    if (status && status !== oldOrder.status) {
      try {
        await emailService.sendOrderStatusUpdate(
          { 
            email: updatedOrder.email, 
            first_name: updatedOrder.first_name, 
            last_name: updatedOrder.last_name 
          },
          updatedOrder,
          status
        );
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }

      // Create notification
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type, data) VALUES (?, ?, ?, ?, ?)',
        [updatedOrder.user_id, 'Order Status Updated', `Your order status is now: ${status}`, 'order_update', JSON.stringify({ orderId: id, newStatus: status })]
      );
    }

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: { order: updatedOrder }
    });

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM orders WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Cancel order (user can cancel their own pending orders)
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if order exists
    const [existingOrders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (existingOrders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = existingOrders[0];

    // Check if user can cancel this order
    if (req.user.role !== 'admin' && req.user.id !== order.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if order can be cancelled
    if (order.status !== 'pending' && order.status !== 'received') {
      return res.status(400).json({ error: 'Order cannot be cancelled in current status' });
    }

    // Update order status to cancelled
    await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['cancelled', id]
    );

    // Get updated order with user details
    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.company,
        u.street_address,
        u.city,
        u.state,
        u.zip_code,
        u.country
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

    const updatedOrder = orders[0];

    // Create notification for user
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type, data) VALUES (?, ?, ?, ?, ?)',
      [order.user_id, 'Order Cancelled', 'Your order has been cancelled successfully', 'order_update', JSON.stringify({ orderId: id })]
    );

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order: updatedOrder }
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Get order statistics (admin only)
router.get('/admin/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_orders
      FROM orders
    `);

    // Get weekly order data for chart
    const [weeklyData] = await pool.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    res.json({
      success: true,
      data: {
        overview: stats[0],
        weeklyData
      }
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
});

module.exports = router;