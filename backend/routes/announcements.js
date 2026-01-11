const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper function to format date for MySQL (YYYY-MM-DD HH:MM:SS)
function formatDateForMySQL(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.getFullYear() + '-' + 
         String(d.getMonth() + 1).padStart(2, '0') + '-' + 
         String(d.getDate()).padStart(2, '0') + ' ' + 
         String(d.getHours()).padStart(2, '0') + ':' + 
         String(d.getMinutes()).padStart(2, '0') + ':' + 
         String(d.getSeconds()).padStart(2, '0');
}

// Configure multer for announcement media uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'announcements');
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'announcement-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, video, and document files are allowed'));
    }
  }
});

// Add reply to announcement
router.post('/:id/replies', authenticateToken, upload.array('media', 3), [
  body('content').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;

    // Check if announcement exists
    const [announcements] = await pool.execute('SELECT id FROM announcements WHERE id = ? AND is_active = TRUE', [id]);
    if (announcements.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Handle media files for reply
    let mediaFiles = [];
    if (req.files && req.files.length > 0) {
      mediaFiles = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/announcements/${file.filename}`
      }));
    }

    const [result] = await pool.execute(
      'INSERT INTO announcement_replies (announcement_id, user_id, content, media_files) VALUES (?, ?, ?, ?)',
      [id, req.user.id, content, JSON.stringify(mediaFiles)]
    );

    const replyId = result.insertId;

    // Increment the announcement's reply count
    await pool.execute('UPDATE announcements SET reply_count = reply_count + 1 WHERE id = ?', [id]);

    // Get the created reply with user info
    const [replies] = await pool.execute(`
      SELECT 
        r.*,
        u.first_name,
        u.last_name,
        u.role,
        u.avatar
      FROM announcement_replies r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [replyId]);

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: { reply: replies[0] }
    });

  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// Get replies for announcement
router.get('/:id/replies', async (req, res) => {
  try {
    const { id } = req.params;

    const [replies] = await pool.execute(`
      SELECT 
        r.*,
        u.first_name,
        u.last_name,
        u.role,
        u.avatar
      FROM announcement_replies r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.announcement_id = ?
      ORDER BY r.created_at ASC
    `, [id]);

    // Parse JSON fields for each reply
    const parsedReplies = replies.map(r => ({
      ...r,
      media_files: r.media_files ? (typeof r.media_files === 'string' ? JSON.parse(r.media_files) : r.media_files) : []
    }));

    res.json({
      success: true,
      data: { replies: parsedReplies }
    });

  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const [announcements] = await pool.execute(`
      SELECT 
        a.*,
        a.reply_count,
        u.first_name,
        u.last_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.is_active = TRUE
      ORDER BY a.pinned DESC, a.priority DESC, a.created_at DESC
    `);

    // Parse JSON fields for each announcement
    const parsedAnnouncements = announcements.map(a => ({
      ...a,
      media_files: a.media_files ? (typeof a.media_files === 'string' ? JSON.parse(a.media_files) : a.media_files) : [],
      tags: a.tags ? (typeof a.tags === 'string' ? JSON.parse(a.tags) : a.tags) : []
    }));

    res.json({
      success: true,
      data: { announcements: parsedAnnouncements }
    });

  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get single announcement
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [announcements] = await pool.execute(`
      SELECT 
        a.*,
        a.reply_count,
        u.first_name,
        u.last_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.id = ? AND a.is_active = TRUE
    `, [id]);

    if (announcements.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Parse JSON fields for the announcement
    const announcement = {
      ...announcements[0],
      media_files: announcements[0].media_files ? (typeof announcements[0].media_files === 'string' ? JSON.parse(announcements[0].media_files) : announcements[0].media_files) : [],
      tags: announcements[0].tags ? (typeof announcements[0].tags === 'string' ? JSON.parse(announcements[0].tags) : announcements[0].tags) : []
    };

    res.json({
      success: true,
      data: { announcement }
    });

  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// Track announcement view with unique tracking
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId || generateSessionId(req);
    
    // Check if announcement exists
    const [announcements] = await pool.execute('SELECT id FROM announcements WHERE id = ? AND is_active = TRUE', [id]);
    if (announcements.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Check if this user/session has already viewed this announcement
    const [existingViews] = await pool.execute(
      `SELECT id FROM announcement_views 
       WHERE announcement_id = ? AND (user_id = ? OR (user_id IS NULL AND session_id = ?))`,
      [id, userId, sessionId]
    );

    // Only count view if this is a new unique view
    if (existingViews.length === 0) {
      // Record the view
      await pool.execute(
        `INSERT INTO announcement_views (announcement_id, user_id, session_id) VALUES (?, ?, ?)`,
        [id, userId, sessionId]
      );
      
      // Increment the announcement's view count
      await pool.execute('UPDATE announcements SET views = views + 1 WHERE id = ?', [id]);
    }

    res.json({ success: true, message: 'View counted', unique: existingViews.length === 0 });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
});

// Helper function to generate a session ID if not provided
function generateSessionId(req) {
  if (!req.cookies) req.cookies = {};
  if (!req.cookies.sessionId) {
    req.cookies.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  return req.cookies.sessionId;
}

// Create announcement (admin only)
router.post('/', authenticateToken, requireAdmin, upload.array('media', 5), [
  body('title').trim().isLength({ min: 1 }),
  body('content').trim().isLength({ min: 1 }),
  body('type').optional().isIn(['info', 'maintenance', 'update', 'urgent', 'promotion']),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  body('status').optional().isIn(['draft', 'published', 'scheduled']),
  body('target_audience').optional().isIn(['all', 'customers', 'admins', 'users'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      title, 
      content, 
      summary,
      type = 'info', 
      priority = 'normal',
      status = 'draft',
      target_audience = 'all',
      scheduled_for,
      expires_at,
      pinned = false,
      tags 
    } = req.body;
    
    // Handle media files
    let mediaFiles = [];
    if (req.files && req.files.length > 0) {
      mediaFiles = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/announcements/${file.filename}`
      }));
    }

    // Determine published_at based on status
    let published_at = null;
    if (status === 'published') {
      published_at = formatDateForMySQL(new Date());
    } else if (status === 'scheduled' && scheduled_for) {
      published_at = formatDateForMySQL(scheduled_for);
    }
    
    // Format scheduled_for and expires_at for MySQL
    const formattedScheduledFor = scheduled_for ? formatDateForMySQL(scheduled_for) : null;
    const formattedExpiresAt = expires_at ? formatDateForMySQL(expires_at) : null;
    

    const [result] = await pool.execute(
      `INSERT INTO announcements (
        title, content, summary, type, priority, status, target_audience, 
        scheduled_for, expires_at, pinned, tags, created_by, media_files, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, 
        content, 
        summary || '',
        type, 
        priority,
        status,
        target_audience,
        formattedScheduledFor,
        formattedExpiresAt,
        pinned === 'true' || pinned === true,
        tags ? JSON.stringify(Array.isArray(tags) ? tags : JSON.parse(tags)) : '[]',
        req.user.id, 
        JSON.stringify(mediaFiles),
        published_at
      ]
    );

    const announcementId = result.insertId;

    // Get created announcement
    const [announcements] = await pool.execute(`
      SELECT 
        a.*,
        u.first_name,
        u.last_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.id = ?
    `, [announcementId]);

    // Create notifications for target users if published or scheduled
    if (status === 'published' || status === 'scheduled') {
      let userQuery = 'SELECT id FROM users WHERE is_active = TRUE';
      const queryParams = [];
      
      if (target_audience !== 'all') {
        userQuery += ' AND role = ?';
        queryParams.push(target_audience === 'customers' ? 'user' : target_audience);
      }
      
      const [users] = await pool.execute(userQuery, queryParams);
      for (const user of users) {
        await pool.execute(
          'INSERT INTO notifications (user_id, title, message, type, data) VALUES (?, ?, ?, ?, ?)',
          [user.id, 'New Announcement', title, 'announcement', JSON.stringify({ announcementId })]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: { announcement: announcements[0] }
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Update announcement (admin only)
router.put('/:id', authenticateToken, requireAdmin, upload.array('media', 5), [
  body('title').optional().trim().isLength({ min: 1 }),
  body('content').optional().trim().isLength({ min: 1 }),
  body('type').optional().isIn(['info', 'maintenance', 'update', 'urgent', 'promotion']),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  body('status').optional().isIn(['draft', 'published', 'scheduled', 'expired']),
  body('target_audience').optional().isIn(['all', 'customers', 'admins', 'users'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { 
      title, 
      content, 
      summary,
      type, 
      priority, 
      status,
      target_audience,
      scheduled_for,
      expires_at,
      pinned,
      tags,
      removeMedia
    } = req.body;

    // Get existing announcement
    const [existing] = await pool.execute('SELECT * FROM announcements WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    const existingAnnouncement = existing[0];
    let existingMedia = [];
    try {
      existingMedia = typeof existingAnnouncement.media_files === 'string' 
        ? JSON.parse(existingAnnouncement.media_files) 
        : existingAnnouncement.media_files || [];
    } catch (e) {
      existingMedia = [];
    }

    // Handle media files
    let newMediaFiles = [];
    if (req.files && req.files.length > 0) {
      newMediaFiles = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/announcements/${file.filename}`
      }));
    }

    // Handle media removal
    let mediaToRemove = [];
    if (removeMedia) {
      try {
        mediaToRemove = Array.isArray(removeMedia) ? removeMedia : JSON.parse(removeMedia);
      } catch (e) {
        mediaToRemove = [];
      }
    }

    // Filter out removed media
    const filteredMedia = existingMedia.filter((m) => !mediaToRemove.includes(m.url));
    const combinedMedia = [...filteredMedia, ...newMediaFiles];

    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(content);
    }
    if (summary !== undefined) {
      updateFields.push('summary = ?');
      updateValues.push(summary);
    }
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(type);
    }
    if (priority !== undefined) {
      updateFields.push('priority = ?');
      updateValues.push(priority);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
      
      // Set published_at when status changes to published
      if (status === 'published') {
        updateFields.push('published_at = ?');
        updateValues.push(formatDateForMySQL(new Date()));
      }
    }
    if (target_audience !== undefined) {
      updateFields.push('target_audience = ?');
      updateValues.push(target_audience);
    }
    if (scheduled_for !== undefined) {
      updateFields.push('scheduled_for = ?');
      updateValues.push(scheduled_for ? formatDateForMySQL(scheduled_for) : null);
    }
    if (expires_at !== undefined) {
      updateFields.push('expires_at = ?');
      updateValues.push(expires_at ? formatDateForMySQL(expires_at) : null);
    }
    if (pinned !== undefined) {
      updateFields.push('pinned = ?');
      updateValues.push(pinned === 'true' || pinned === true);
    }
    if (tags !== undefined) {
      updateFields.push('tags = ?');
      updateValues.push(JSON.stringify(Array.isArray(tags) ? tags : JSON.parse(tags)));
    }
    
    updateFields.push('media_files = ?');
    updateValues.push(JSON.stringify(combinedMedia));

    if (updateFields.length === 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE announcements SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [announcements] = await pool.execute(`
      SELECT 
        a.*,
        u.first_name,
        u.last_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: { announcement: announcements[0] }
    });

  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM announcements WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;