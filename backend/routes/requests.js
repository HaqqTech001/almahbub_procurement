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
    cb(null, 'uploads/requests/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'request-' + uniqueSuffix + path.extname(file.originalname));
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

// Create new request
router.post('/', authenticateToken, requireVerified, upload.array('files', 5), [
  body('title').trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('productId').optional().isInt(),
  body('quantity').optional().isInt({ min: 1 })
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
      url: `/uploads/requests/${file.filename}`,
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

    // Create request with user-specific request number
    const [result] = await pool.execute(
      `INSERT INTO orders (user_id, request_number, product_id, title, description, quantity, files) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, requestNumber, productId || null, title, description, quantity, JSON.stringify(fileUrls)]
    );

    const requestId = result.insertId;

    // Get created request with user details
    const [requests] = await pool.execute(`
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email,
        p.name as product_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `, [requestId]);

    const request = requests[0];

    // Create notification for admins
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type, data) VALUES (?, ?, ?, ?, ?)',
      [1, 'New Request Received', `New request: ${title}`, 'request', JSON.stringify({ requestId, userId: req.user.id })]
    );

    // Send email notification to admins (you might want to get all admin emails)
    const [admins] = await pool.execute('SELECT email, first_name, last_name FROM users WHERE role = "admin"');
    for (const admin of admins) {
      try {
        // In a real app, you'd send to the admin
        console.log(`Would send new request notification to ${admin.email}`);
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      data: { request }
    });

  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Get all requests (admin) or user requests
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email,
        u.company,
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

    const [requests] = await pool.execute(query, params);

    res.json({
      success: true,
      data: { requests }
    });

  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Get user's requests
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user can access these requests
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [requests] = await pool.execute(`
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email,
        u.company,
        p.name as product_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: { requests }
    });

  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({ error: 'Failed to fetch user requests' });
  }
});

// Get single request
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [requests] = await pool.execute(`
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email,
        u.company,
        u.phone,
        p.name as product_name,
        p.description as product_description
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `, [id]);

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const requestData = requests[0];

    // Check if user can access this request
    if (req.user.role !== 'admin' && req.user.id !== requestData.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Transform request data to match frontend expectations
    const transformedRequest = {
      id: requestData.id,
      requestNumber: requestData.request_number || `REQ-${requestData.id.toString().padStart(6, '0')}`,
      status: requestData.status || 'received',
      totalAmount: 0,
      currency: requestData.currency || 'USD',
      subtotal: 0,
      tax: 0,
      items: [
        {
          id: 1,
          productId: requestData.product_id || 1,
          productName: requestData.product_name || requestData.title || 'Procurement Item',
          description: requestData.description || requestData.product_description || 'Procurement request item',
          specifications: requestData.specifications || 'Custom specifications',
          quantity: requestData.quantity || 1,
          unitPrice: 0,
          totalPrice: 0,
          category: requestData.category || 'General Procurement'
        }
      ],
      deliveryAddress: {
        fullName: `${requestData.first_name} ${requestData.last_name}`,
        companyName: requestData.company || '',
        street: requestData.delivery_address || 'Address to be provided',
        city: 'City',
        state: 'State',
        zipCode: '00000',
        country: 'Country',
        phone: requestData.phone || ''
      },
      paymentMethod: requestData.payment_method || 'Quote-based',
      paymentStatus: 'pending',
      createdAt: requestData.created_at,
      updatedAt: requestData.updated_at,
      description: requestData.description || 'Procurement request',
      priority: requestData.priority || 'medium',
      expectedDeliveryDate: requestData.expected_delivery_date,
      specialInstructions: requestData.special_instructions,
      assignedTo: requestData.assigned_to,
      notes: requestData.admin_notes,
      // Include original request data
      _request: requestData
    };

    res.json({
      success: true,
      data: { request: transformedRequest }
    });

  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// Update request (admin only)
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

    // Check if request exists
    const [existingRequests] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (existingRequests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const oldRequest = existingRequests[0];
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

    // Get updated request
    const [requests] = await pool.execute(`
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

    const updatedRequest = requests[0];

    // Send email notification if status changed
    if (status && status !== oldRequest.status) {
      try {
        await emailService.sendOrderStatusUpdate(
          { 
            email: updatedRequest.email, 
            first_name: updatedRequest.first_name, 
            last_name: updatedRequest.last_name 
          },
          updatedRequest,
          status
        );
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }

      // Create notification
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type, data) VALUES (?, ?, ?, ?, ?)',
        [updatedRequest.user_id, 'Request Status Updated', `Your request status is now: ${status}`, 'request', JSON.stringify({ requestId: id, newStatus: status })]
      );
    }

    res.json({
      success: true,
      message: 'Request updated successfully',
      data: { request: updatedRequest }
    });

  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// Delete request (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM orders WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });

  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

// Cancel request (user can cancel their own pending requests)
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if request exists
    const [existingRequests] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (existingRequests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = existingRequests[0];

    // Check if user can cancel this request
    if (req.user.role !== 'admin' && req.user.id !== request.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if request can be cancelled
    if (request.status !== 'pending' && request.status !== 'received') {
      return res.status(400).json({ error: 'Request cannot be cancelled in current status' });
    }

    // Update request status to cancelled
    await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['cancelled', id]
    );

    // Get updated request with user details
    const [requests] = await pool.execute(`
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

    const updatedRequest = requests[0];

    // Create notification for user
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type, data) VALUES (?, ?, ?, ?, ?)',
      [request.user_id, 'Request Cancelled', 'Your request has been cancelled successfully', 'request', JSON.stringify({ requestId: id })]
    );

    res.json({
      success: true,
      message: 'Request cancelled successfully',
      data: { request: updatedRequest }
    });

  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});

// Get request statistics (admin only)
router.get('/admin/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_requests
      FROM orders
    `);

    // Get weekly request data for chart
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
    console.error('Get request stats error:', error);
    res.status(500).json({ error: 'Failed to fetch request statistics' });
  }
});

module.exports = router;
