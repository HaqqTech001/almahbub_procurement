const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// AI Auto-responder endpoint
router.post('/auto-respond', authenticateToken, [
  body('message').trim().isLength({ min: 1 }),
  body('orderId').optional().isInt(),
  body('context').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, orderId, context = {} } = req.body;

    // Try to find relevant answer from knowledge base
    let aiResponse = await aiService.findRelevantAnswer(message);
    
    if (!aiResponse) {
      // Generate contextual response
      const contextual = await aiService.generateContextualResponse(message, { orderId, ...context });
      aiResponse = {
        answer: contextual.response,
        confidence: 0.3,
        source: 'contextual'
      };
    }

    res.json({
      success: true,
      data: {
        response: aiResponse.answer,
        confidence: aiResponse.confidence,
        source: aiResponse.source,
        matchedQuestion: aiResponse.matchedQuestion
      }
    });

  } catch (error) {
    console.error('AI auto-respond error:', error);
    res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
});

// Add knowledge base entry (admin only)
router.post('/knowledge', authenticateToken, requireAdmin, [
  body('question').trim().isLength({ min: 1 }),
  body('answer').trim().isLength({ min: 1 }),
  body('confidence').optional().isFloat({ min: 0, max: 1 }),
  body('source').optional().trim(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { question, answer, confidence = 0.50, source = 'manual', tags = [] } = req.body;

    const knowledgeId = await aiService.addToKnowledgeBase(question, answer, source, tags);

    const [knowledge] = await pool.execute('SELECT * FROM ai_knowledge WHERE id = ?', [knowledgeId]);

    res.status(201).json({
      success: true,
      message: 'Knowledge base entry added successfully',
      data: { knowledge: knowledge[0] }
    });

  } catch (error) {
    console.error('Add knowledge error:', error);
    res.status(500).json({ error: 'Failed to add knowledge base entry' });
  }
});

// Get knowledge base entries (admin only)
router.get('/knowledge', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, source } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offsetNum = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM ai_knowledge WHERE 1=1';
    let params = [];

    if (search) {
      query += ' AND (question LIKE ? OR answer LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }

    query += ' ORDER BY usage_count DESC, confidence_score DESC LIMIT ? OFFSET ?';
    params.push(Number(limitNum), Number(offsetNum));

    const [knowledge] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM ai_knowledge WHERE 1=1';
    let countParams = [];

    if (search) {
      countQuery += ' AND (question LIKE ? OR answer LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (source) {
      countQuery += ' AND source = ?';
      countParams.push(source);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        knowledge,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Get knowledge error:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

// Update knowledge base entry (admin only)
router.put('/knowledge/:id', authenticateToken, requireAdmin, [
  body('question').optional().trim().isLength({ min: 1 }),
  body('answer').optional().trim().isLength({ min: 1 }),
  body('confidence').optional().isFloat({ min: 0, max: 1 }),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { question, answer, confidence, isActive } = req.body;

    await aiService.updateKnowledgeItem(id, question, answer, confidence);

    const [knowledge] = await pool.execute('SELECT * FROM ai_knowledge WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Knowledge base entry updated successfully',
      data: { knowledge: knowledge[0] }
    });

  } catch (error) {
    console.error('Update knowledge error:', error);
    res.status(500).json({ error: 'Failed to update knowledge base entry' });
  }
});

// Get AI statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await aiService.getKnowledgeStats();

    // Get recent AI responses
    const [recentResponses] = await pool.execute(`
      SELECT 
        message,
        is_ai_response,
        created_at
      FROM chat_messages 
      WHERE is_ai_response = TRUE
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Get response sources breakdown
    const [sources] = await pool.execute(`
      SELECT 
        source,
        COUNT(*) as count
      FROM ai_knowledge
      WHERE is_active = TRUE
      GROUP BY source
    `);

    res.json({
      success: true,
      data: {
        overview: stats,
        recentResponses,
        sources
      }
    });

  } catch (error) {
    console.error('Get AI stats error:', error);
    res.status(500).json({ error: 'Failed to fetch AI statistics' });
  }
});

// Learn from admin response (admin only)
router.post('/learn', authenticateToken, requireAdmin, [
  body('userMessage').trim().isLength({ min: 1 }),
  body('adminResponse').trim().isLength({ min: 1 }),
  body('context').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userMessage, adminResponse, context = {} } = req.body;

    await aiService.learnFromAdminResponse(userMessage, adminResponse, context);

    res.json({
      success: true,
      message: 'AI learned from admin response successfully'
    });

  } catch (error) {
    console.error('AI learn error:', error);
    res.status(500).json({ error: 'Failed to learn from admin response' });
  }
});

module.exports = router;