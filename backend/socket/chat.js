const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');

// Store connected users
const connectedUsers = new Map();

function setupSocketHandlers(io) {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      const [users] = await pool.execute(
        'SELECT id, email, first_name, last_name, role FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users.length === 0) {
        return next(new Error('User not found'));
      }

      socket.user = users[0];
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.first_name} ${socket.user.last_name} (${socket.user.id})`);
    
    // Store user connection
    connectedUsers.set(socket.user.id, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });

    // Update user status to online in database
    (async () => {
      try {
        await pool.execute(
          'UPDATE users SET is_online = TRUE, last_active_at = NOW() WHERE id = ?',
          [socket.user.id]
        );
      } catch (error) {
        console.error('Error updating user online status:', error);
      }
    })();

    // Join user to their personal room
    socket.join(`user_${socket.user.id}`);

    // Join admins to admin room
    if (socket.user.role === 'admin') {
      socket.join('admin_room');
    }

    // Broadcast user online status to all connected users
    io.emit('user_online', { 
      userId: socket.user.id, 
      userName: `${socket.user.first_name} ${socket.user.last_name}`,
      role: socket.user.role
    });

    // Send initial unread count - calculate from database, don't just emit 0
    (async () => {
      try {
        const [result] = await pool.execute(
          'SELECT COUNT(*) as count FROM chat_messages WHERE receiver_id = ? AND is_read = FALSE',
          [socket.user.id]
        );
        socket.emit('unread_count', { count: result[0].count || 0 });
      } catch (error) {
        console.error('Error calculating unread count:', error);
        socket.emit('unread_count', { count: 0 });
      }
    })();

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, message, messageType = 'text', fileUrl, orderId, formData } = data;

        // Save message to database
        const [result] = await pool.execute(
          'INSERT INTO chat_messages (sender_id, receiver_id, order_id, message, message_type, file_url, form_data) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [socket.user.id, receiverId, orderId || null, message, messageType, fileUrl || null, formData ? JSON.stringify(formData) : null]
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

        // Send to receiver
        io.to(`user_${receiverId}`).emit('new_message', savedMessage);

        // Send confirmation to sender
        socket.emit('message_sent', savedMessage);

        // Create notification for receiver
        await createNotification(receiverId, 'new_message', 'New Message', `New message from ${socket.user.first_name}`, {
          messageId,
          senderId: socket.user.id,
          senderName: `${socket.user.first_name} ${socket.user.last_name}`
        });

        // Send email notification if user is offline
        await sendEmailNotification(receiverId, socket.user, message);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle sending form messages (admin only)
    socket.on('send_form_message', async (data) => {
      try {
        const { receiverId, formTitle, formFields, orderId } = data;

        if (socket.user.role !== 'admin') {
          return socket.emit('error', { message: 'Only admins can send form messages' });
        }

        // Create form message
        const formData = {
          title: formTitle,
          fields: formFields,
          submitted: false,
          responses: null
        };

        // Save form message to database
        const [result] = await pool.execute(
          'INSERT INTO chat_messages (sender_id, receiver_id, order_id, message, message_type, form_data) VALUES (?, ?, ?, ?, ?, ?)',
          [socket.user.id, receiverId, orderId || null, formTitle, 'form', JSON.stringify(formData)]
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

        // Send to receiver
        io.to(`user_${receiverId}`).emit('new_message', savedMessage);

        // Send confirmation to sender
        socket.emit('form_sent', savedMessage);

        // Create notification for receiver
        await createNotification(receiverId, 'form_message', 'Form Received', `You have received a form from ${socket.user.first_name}`, {
          messageId,
          senderId: socket.user.id,
          senderName: `${socket.user.first_name} ${socket.user.last_name}`
        });

      } catch (error) {
        console.error('Error sending form message:', error);
        socket.emit('error', { message: 'Failed to send form message' });
      }
    });

    // Handle form response submission
    socket.on('submit_form_response', async (data) => {
      try {
        const { messageId, responses } = data;

        // Get the original message
        const [originalMessages] = await pool.execute(
          'SELECT * FROM chat_messages WHERE id = ? AND receiver_id = ?',
          [messageId, socket.user.id]
        );

        if (originalMessages.length === 0) {
          return socket.emit('error', { message: 'Form not found' });
        }

        const originalMessage = originalMessages[0];
        let formData = typeof originalMessage.form_data === 'string' 
          ? JSON.parse(originalMessage.form_data) 
          : originalMessage.form_data;

        // Update form data with responses
        formData.submitted = true;
        formData.responses = responses;
        formData.submittedAt = new Date().toISOString();

        // Update message in database
        await pool.execute(
          'UPDATE chat_messages SET form_data = ?, is_read = FALSE WHERE id = ?',
          [JSON.stringify(formData), messageId]
        );

        // Get updated message with user info
        const [updatedMessages] = await pool.execute(`
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

        const updatedMessage = updatedMessages[0];

        // Notify the original sender (admin) that form was submitted
        io.to(`user_${originalMessage.sender_id}`).emit('form_response_received', updatedMessage);

        // Confirm to the user who submitted
        socket.emit('form_response_sent', { success: true, messageId });

      } catch (error) {
        console.error('Error submitting form response:', error);
        socket.emit('error', { message: 'Failed to submit form response' });
      }
    });

    // Handle marking messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { senderId, messageIds } = data;
        
        if (messageIds && Array.isArray(messageIds)) {
          // Mark specific messages as read
          const placeholders = messageIds.map(() => '?').join(',');
          await pool.execute(
            `UPDATE chat_messages SET read_at = NOW() WHERE sender_id = ? AND receiver_id = ? AND id IN (${placeholders})`,
            [senderId, socket.user.id, ...messageIds]
          );
        } else {
          // Mark all messages from sender as read
          await pool.execute(
            'UPDATE chat_messages SET read_at = NOW() WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL',
            [senderId, socket.user.id]
          );
        }

        // Update online status and last active
        await pool.execute(
          'UPDATE users SET is_online = TRUE, last_active_at = NOW() WHERE id = ?',
          [socket.user.id]
        );

        // Notify sender that messages were read
        io.to(`user_${senderId}`).emit('messages_read', { 
          readerId: socket.user.id,
          readerName: `${socket.user.first_name} ${socket.user.last_name}`,
          messageIds: messageIds || 'all'
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      io.to(`user_${data.receiverId}`).emit('user_typing', {
        userId: socket.user.id,
        userName: `${socket.user.first_name} ${socket.user.last_name}`
      });
    });

    socket.on('typing_stop', (data) => {
      io.to(`user_${data.receiverId}`).emit('user_stopped_typing', {
        userId: socket.user.id
      });
    });

    // Get online users
    socket.on('get_online_users', async () => {
      try {
        // Get users who are connected via socket
        const onlineUserIds = Array.from(connectedUsers.keys());
        
        // Also check database for recently active users
        const [recentUsers] = await pool.execute(
          `SELECT id, first_name, last_name, role, is_online, last_active_at 
           FROM users 
           WHERE is_online = TRUE OR last_active_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`
        );

        socket.emit('online_users_list', { users: recentUsers });
      } catch (error) {
        console.error('Error getting online users:', error);
        socket.emit('online_users_list', { users: [] });
      }
    });

    // Handle AI auto-responder
    socket.on('ai_auto_respond', async (data) => {
      try {
        const { message, orderId } = data;
        
        // Check if any admin is online
        const adminOnline = Array.from(connectedUsers.values()).some(
          connection => connection.user.role === 'admin'
        );

        if (!adminOnline) {
          // Try to find relevant answer from knowledge base
          let aiResponse = await aiService.findRelevantAnswer(message);
          
          if (!aiResponse) {
            // Generate contextual response
            const contextual = await aiService.generateContextualResponse(message, { orderId });
            aiResponse = {
              answer: contextual.response,
              confidence: 0.3,
              source: 'contextual'
            };
          }

          // Save AI response to database
          const [result] = await pool.execute(
            'INSERT INTO chat_messages (sender_id, receiver_id, order_id, message, message_type, is_ai_response) VALUES (?, ?, ?, ?, ?, ?)',
            [1, socket.user.id, orderId, aiResponse.answer, 'text', true] // Using admin ID 1 as AI sender
          );

          const messageId = result.insertId;

          // Get the AI message with user info
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

          const aiMessage = messages[0];

          // Send AI response to user
          socket.emit('ai_response', aiMessage);

          // Notify admins that AI responded
          io.to('admin_room').emit('ai_responded', {
            userId: socket.user.id,
            userMessage: message,
            aiResponse: aiMessage,
            confidence: aiResponse.confidence
          });

          // Create notification for user
          await createNotification(socket.user.id, 'ai_response', 'AI Assistant Response', 'You have received an automated response', {
            messageId,
            isAI: true
          });
        }

      } catch (error) {
        console.error('Error in AI auto-responder:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.first_name} ${socket.user.last_name} (${socket.user.id})`);
      connectedUsers.delete(socket.user.id);

      // Update user status to offline in database
      (async () => {
        try {
          await pool.execute(
            'UPDATE users SET is_online = FALSE WHERE id = ?',
            [socket.user.id]
          );

          // Broadcast user offline status
          io.emit('user_offline', { 
            userId: socket.user.id,
            userName: `${socket.user.first_name} ${socket.user.last_name}`,
            role: socket.user.role
          });
        } catch (error) {
          console.error('Error updating user offline status:', error);
        }
      })();
    });

    // Get conversation history
    socket.on('get_conversation', async (data) => {
      try {
        const { userId, orderId, page = 1, limit = 50 } = data;
        const offset = (page - 1) * limit;

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
          ${orderId ? 'AND (m.order_id = ? OR m.order_id IS NULL)' : ''}
          ORDER BY m.created_at DESC
          LIMIT ? OFFSET ?
        `, orderId ? 
          [socket.user.id, userId, userId, socket.user.id, orderId, limit, offset] :
          [socket.user.id, userId, userId, socket.user.id, limit, offset]
        );

        socket.emit('conversation_history', {
          messages: messages.reverse(),
          hasMore: messages.length === limit
        });

      } catch (error) {
        console.error('Error getting conversation:', error);
        socket.emit('error', { message: 'Failed to load conversation' });
      }
    });

    // Get all conversations
    socket.on('get_conversations', async () => {
      try {
        const [conversations] = await pool.execute(`
          SELECT DISTINCT
            u.id,
            u.first_name,
            u.last_name,
            u.role,
            u.avatar,
            u.is_online,
            u.last_active_at,
            MAX(m.created_at) as last_message_time,
            SUM(CASE WHEN m.receiver_id = ? AND m.is_read = FALSE THEN 1 ELSE 0 END) as unread_count,
            (SELECT message FROM chat_messages WHERE ((sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)) ORDER BY created_at DESC LIMIT 1) as last_message
          FROM users u
          LEFT JOIN chat_messages m ON ((m.sender_id = u.id AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = u.id))
          WHERE u.id != ?
          GROUP BY u.id
          ORDER BY last_message_time DESC
        `, [socket.user.id, socket.user.id, socket.user.id, socket.user.id, socket.user.id, socket.user.id]);

        socket.emit('conversations_list', conversations);

      } catch (error) {
        console.error('Error getting conversations:', error);
        socket.emit('error', { message: 'Failed to load conversations' });
      }
    });
  });
}

async function createNotification(userId, type, title, message, data = {}) {
  try {
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type, data) VALUES (?, ?, ?, ?, ?)',
      [userId, title, message, type, JSON.stringify(data)]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

async function sendEmailNotification(receiverId, sender, message) {
  try {
    // Check if user has been inactive for a while (simple heuristic)
    const connection = connectedUsers.get(receiverId);
    if (!connection || (Date.now() - connection.connectedAt.getTime()) > 300000) { // 5 minutes
      const [users] = await pool.execute('SELECT email, first_name FROM users WHERE id = ?', [receiverId]);
      if (users.length > 0) {
        await emailService.sendNewMessageNotification(users[0], sender, message);
      }
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

module.exports = { setupSocketHandlers };
