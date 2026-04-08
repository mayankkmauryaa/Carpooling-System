const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

router.get('/', auth, messageController.getMessages);
router.get('/conversations', auth, messageController.getConversations);
router.get('/unread-count', auth, messageController.getUnreadCount);
router.get('/conversation/:userId', auth, messageController.getConversationByUser);
router.post('/', auth, messageController.sendNewMessage);
router.put('/read', auth, messageController.markAsRead);
router.put('/read/:userId', auth, messageController.markConversationAsRead);
router.delete('/:messageId', auth, messageController.deleteMessage);
router.delete('/conversation/:userId', auth, messageController.deleteConversation);

module.exports = router;
