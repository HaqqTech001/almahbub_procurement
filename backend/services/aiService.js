const { pool } = require('../config/database');

class AIService {
  async findRelevantAnswer(userMessage) {
    try {
      // Clean and normalize the user message
      const cleanedMessage = this.cleanMessage(userMessage.toLowerCase());
      
      // Get all active knowledge base entries
      const [knowledge] = await pool.execute(
        'SELECT * FROM ai_knowledge WHERE is_active = TRUE ORDER BY confidence_score DESC, usage_count ASC'
      );

      let bestMatch = null;
      let bestScore = 0;

      for (const item of knowledge) {
        const score = this.calculateSimilarity(cleanedMessage, item.question.toLowerCase());
        if (score > bestScore && score > 0.3) { // Minimum threshold
          bestMatch = item;
          bestScore = score;
        }
      }

      if (bestMatch) {
        // Update usage count
        await pool.execute(
          'UPDATE ai_knowledge SET usage_count = usage_count + 1 WHERE id = ?',
          [bestMatch.id]
        );

        return {
          answer: bestMatch.answer,
          confidence: bestMatch.confidence_score,
          source: bestMatch.source,
          matchedQuestion: bestMatch.question
        };
      }

      return null;
    } catch (error) {
      console.error('AI Service error:', error);
      return null;
    }
  }

  calculateSimilarity(str1, str2) {
    // Simple similarity calculation using word overlap
    const words1 = str1.split(/\s+/).filter(word => word.length > 2);
    const words2 = str2.split(/\s+/).filter(word => word.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    return intersection.size / Math.min(set1.size, set2.size);
  }

  cleanMessage(message) {
    return message
      .replace(/[^\w\s]/gi, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  async generateContextualResponse(userMessage, context = {}) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Greeting patterns
    if (this.matchesPattern(lowerMessage, ['hello', 'hi', 'hey', 'greetings'])) {
      return {
        response: "Hello! 👋 Welcome to Almahbub International! I'm here to help you with our procurement services. How can I assist you today?",
        type: 'greeting'
      };
    }

    // Pricing inquiries
    if (this.matchesPattern(lowerMessage, ['price', 'cost', 'quote', 'pricing', 'budget'])) {
      return {
        response: "💰 For pricing information, please note that Almahbub operates as a procurement service rather than direct sales. Each request is evaluated individually. You can create an order with your requirements and budget, and our team will provide you with a customized quote. Would you like me to guide you through the ordering process?",
        type: 'pricing'
      };
    }

    // Order status inquiries
    if (this.matchesPattern(lowerMessage, ['order status', 'tracking', 'where is my order', 'order update'])) {
      return {
        response: "📦 To check your order status, please log into your account and visit the 'My Orders' section. You can also use our real-time tracking feature. If you need specific help with an order, please provide your order number and I'll connect you with our team!",
        type: 'order_status'
      };
    }

    // Delivery inquiries
    if (this.matchesPattern(lowerMessage, ['delivery', 'shipping', 'when will it arrive', 'timeline'])) {
      return {
        response: "🚚 Delivery timelines vary based on the complexity and quantity of your procurement request. Once your order is approved, we'll provide you with an estimated delivery timeline. You can track your order progress in real-time through your account dashboard.",
        type: 'delivery'
      };
    }

    // Contact inquiries
    if (this.matchesPattern(lowerMessage, ['contact', 'phone', 'email', 'support', 'help'])) {
      return {
        response: "📞 You can reach our team through multiple channels:\n\n• Live chat (like this one!)\n• Email: support@almahbub.com\n• Phone: Available in your account profile\n\nOur team is available Monday-Friday, 9 AM - 6 PM (local time). How else can I help you?",
        type: 'contact'
      };
    }

    // Service inquiries
    if (this.matchesPattern(lowerMessage, ['services', 'what do you do', 'capabilities', 'what can you help'])) {
      return {
        response: "🌟 Almahbub International specializes in procurement services across multiple categories:\n\n• Clothing & Apparel\n• Electronics & Technology\n• Building Materials\n• Accessories & Supplies\n• Custom Solutions\n\nWe handle everything from sourcing to delivery with quality assurance. What type of procurement are you looking for?",
        type: 'services'
      };
    }

    // Default response
    return {
      response: "🤖 I understand you're looking for information! While I can help with general questions, for specific details about your orders or personalized assistance, I'd recommend:\n\n• Checking our FAQ section\n• Creating an order through your dashboard\n• Speaking with our human team via live chat\n\nWhat specific area would you like help with?",
      type: 'default'
    };
  }

  matchesPattern(message, patterns) {
    return patterns.some(pattern => message.includes(pattern));
  }

  async addToKnowledgeBase(question, answer, source = 'manual', tags = []) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO ai_knowledge (question, answer, source, tags) VALUES (?, ?, ?, ?)',
        [question, answer, source, JSON.stringify(tags)]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error adding to knowledge base:', error);
      throw error;
    }
  }

  async updateKnowledgeItem(id, question, answer, confidence = 0.50) {
    try {
      await pool.execute(
        'UPDATE ai_knowledge SET question = ?, answer = ?, confidence_score = ? WHERE id = ?',
        [question, answer, confidence, id]
      );
    } catch (error) {
      console.error('Error updating knowledge item:', error);
      throw error;
    }
  }

  async getKnowledgeStats() {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_items,
          AVG(confidence_score) as avg_confidence,
          SUM(usage_count) as total_usage,
          MAX(usage_count) as max_usage
        FROM ai_knowledge 
        WHERE is_active = TRUE
      `);
      return stats[0];
    } catch (error) {
      console.error('Error getting knowledge stats:', error);
      throw error;
    }
  }

  async learnFromAdminResponse(userMessage, adminResponse, context = {}) {
    // Auto-add successful admin responses to knowledge base
    const question = this.extractQuestion(userMessage) || userMessage;
    const answer = adminResponse;
    
    await this.addToKnowledgeBase(
      question,
      answer,
      'admin_learning',
      ['auto-learned', context.category || 'general']
    );
  }

  extractQuestion(message) {
    // Simple question extraction - look for question marks and key question words
    const questionWords = ['what', 'how', 'when', 'where', 'why', 'who', 'which', 'can you', 'do you', 'is there'];
    const lowerMessage = message.toLowerCase();
    
    for (const word of questionWords) {
      if (lowerMessage.includes(word)) {
        return message;
      }
    }
    
    return null;
  }
}

module.exports = new AIService();