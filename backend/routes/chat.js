const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for chat file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'chat');
    // Create directory if it doesn't exist (including parent directories)
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for chat files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mov|mp3|wav/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      // Instead of throwing an error, we'll handle this in the route
      cb(null, false);
    }
  }
});

// Middleware to handle multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Send message
router.post('/send', authenticateToken, upload.single('file'), handleUploadError, [
  body('receiverId').isInt(),
  body('message').optional().trim(),
  body('orderId').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiverId, message, orderId } = req.body;
    const file = req.file;

    if (!message && !file) {
      return res.status(400).json({ error: 'Message or file is required' });
    }

    let messageType = 'text';
    let fileUrl = null;

    if (file) {
      messageType = file.mimetype.startsWith('image/') ? 'image' : 'file';
      fileUrl = `/uploads/chat/${file.filename}`;
    }

    const [result] = await pool.execute(
      'INSERT INTO chat_messages (sender_id, receiver_id, order_id, message, message_type, file_url) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, receiverId, orderId || null, message || '', messageType, fileUrl]
    );

    const messageId = result.insertId;

    // Get the saved message with user info
    const [messages] = await pool.execute(`
      SELECT 
        m.*,
        u1.first_name as sender_first_name,
        u1.last_name as sender_last_name,
        u1.role as sender_role,
        u1.avatar as sender_avatar,
        u2.first_name as receiver_first_name,
        u2.last_name as receiver_last_name
      FROM chat_messages m
      LEFT JOIN users u1 ON m.sender_id = u1.id
      LEFT JOIN users u2 ON m.receiver_id = u2.id
      WHERE m.id = ?
    `, [messageId]);

    const savedMessage = messages[0];

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: savedMessage }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversation between two users
router.get('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { orderId, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offsetNum = (pageNum - 1) * limitNum;

    // Ensure userId is an integer
    const userIdInt = parseInt(userId) || 0;

    let whereClause = `
      WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
    `;
    let params = [req.user.id, userIdInt, userIdInt, req.user.id];

    if (orderId) {
      whereClause += ' AND (m.order_id = ? OR m.order_id IS NULL)';
      params.push(orderId);
    }

    // Use string interpolation for LIMIT and OFFSET (mysql2 prepared statement limitation)
    const query = `
      SELECT 
        m.*,
        u1.first_name as sender_first_name,
        u1.last_name as sender_last_name,
        u1.role as sender_role,
        u1.avatar as sender_avatar
      FROM chat_messages m
      LEFT JOIN users u1 ON m.sender_id = u1.id
      ${whereClause}
      ORDER BY m.created_at DESC LIMIT ${parseInt(limitNum)} OFFSET ${parseInt(offsetNum)}
    `;

    const [messages] = await pool.execute(query, params);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        hasMore: messages.length === limitNum
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Get all conversations list
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const [conversations] = await pool.execute(`
      SELECT DISTINCT
        u.id,
        u.first_name,
        u.last_name,
        u.role,
        u.avatar,
        MAX(m.created_at) as last_message_time,
        SUM(CASE WHEN m.receiver_id = ? AND m.is_read = FALSE THEN 1 ELSE 0 END) as unread_count,
        (SELECT message FROM chat_messages WHERE ((sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)) ORDER BY created_at DESC LIMIT 1) as last_message
      FROM users u
      LEFT JOIN chat_messages m ON ((m.sender_id = u.id AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = u.id))
      WHERE u.id != ?
      GROUP BY u.id
      ORDER BY last_message_time DESC
    `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);

    res.json({
      success: true,
      data: { conversations }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Mark messages as read
router.put('/markread/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const [result] = await pool.execute(
      'UPDATE chat_messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
      [userId, req.user.id]
    );

    res.json({
      success: true,
      message: 'Messages marked as read',
      data: { updatedCount: result.affectedRows }
    });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Delete message
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user owns the message
    const [messages] = await pool.execute(
      'SELECT sender_id FROM chat_messages WHERE id = ?',
      [id]
    );

    if (messages.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (messages[0].sender_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [result] = await pool.execute('DELETE FROM chat_messages WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Get unread count
router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM chat_messages WHERE receiver_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      success: true,
      data: { count: result[0].count }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Get or create a support conversation (for clients to message admin)
router.get('/support', authenticateToken, async (req, res) => {
  try {
    // Find an available admin user
    const [admins] = await pool.execute(
      "SELECT id, first_name, last_name, role, avatar FROM users WHERE role = 'admin' AND is_active = TRUE LIMIT 1"
    );

    if (admins.length === 0) {
      return res.status(404).json({ error: 'No support staff available' });
    }

    const adminUser = admins[0];

    // Count total messages in this conversation (replyCount)
    const [replyCountResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM chat_messages
       WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))`,
      [req.user.id, adminUser.id, adminUser.id, req.user.id]
    );

    // Get or create view count tracking
    let viewCount = 0;
    try {
      const [viewResult] = await pool.execute(
        `SELECT COUNT(DISTINCT DATE(created_at)) as view_days FROM chat_messages
         WHERE (sender_id = ? OR receiver_id = ?)`,
        [req.user.id, req.user.id]
      );
      viewCount = viewResult[0]?.view_days || 1;
    } catch (viewError) {
      // If view tracking table doesn't exist, default to 1
      viewCount = 1;
    }

    res.json({
      success: true,
      data: {
        conversationId: adminUser.id,
        user: {
          id: adminUser.id,
          firstName: adminUser.first_name,
          lastName: adminUser.last_name,
          role: adminUser.role,
          avatar: adminUser.avatar
        },
        viewCount: viewCount,
        replyCount: replyCountResult[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('Get support conversation error:', error);
    res.status(500).json({ error: 'Failed to get support conversation' });
  }
});

// Get messages with support/admin (alias for conversation/:userId)
router.get('/support/messages', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;

    // Find an available admin user
    const [admins] = await pool.execute(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (admins.length === 0) {
      return res.status(404).json({ error: 'No support staff available' });
    }

    const adminId = admins[0].id;
    const limitNum = parseInt(limit) || 50;
    const offsetNum = before ? parseInt(before) : 0;

    const [messages] = await pool.execute(`
      SELECT 
        m.*,
        u1.first_name as sender_first_name,
        u1.last_name as sender_last_name,
        u1.role as sender_role,
        u1.avatar as sender_avatar
      FROM chat_messages m
      LEFT JOIN users u1 ON m.sender_id = u1.id
      WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
      ORDER BY m.created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}
    `, [req.user.id, adminId, adminId, req.user.id]);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        adminId: adminId
      }
    });

  } catch (error) {
    console.error('Get support messages error:', error);
    res.status(500).json({ error: 'Failed to fetch support messages' });
  }
});

// Send message to support/admin
router.post('/support/send', authenticateToken ,upload.single('file'), handleUploadError, [
  body('message').optional().trim(),
  body('orderId').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, orderId } = req.body;
    const file = req.file;

    if (!message && !file) {
      return res.status(400).json({ error: 'Message or file is required' });
    }

    // Find an available admin user
    const [admins] = await pool.execute(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (admins.length === 0) {
      return res.status(404).json({ error: 'No support staff available' });
    }

    const receiverId = admins[0].id;

    let messageType = 'text';
    let fileUrl = null;

    if (file) {
      messageType = file.mimetype.startsWith('image/') ? 'image' : 'file';
      fileUrl = `/uploads/chat/${file.filename}`;
    }

    const [result] = await pool.execute(
      'INSERT INTO chat_messages (sender_id, receiver_id, order_id, message, message_type, file_url) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, receiverId, orderId || null, message || '', messageType, fileUrl]
    );

    const messageId = result.insertId;

    // Get the saved message with user info
    const [messages] = await pool.execute(`
      SELECT 
        m.*,
        u1.first_name as sender_first_name,
        u1.last_name as sender_last_name,
        u1.role as sender_role,
        u1.avatar as sender_avatar
      FROM chat_messages m
      LEFT JOIN users u1 ON m.sender_id = u1.id
      WHERE m.id = ?
    `, [messageId]);

    const savedMessage = messages[0];

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { 
        message: savedMessage,
        receiverId: receiverId
      }
    });

  } catch (error) {
    console.error('Send support message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;