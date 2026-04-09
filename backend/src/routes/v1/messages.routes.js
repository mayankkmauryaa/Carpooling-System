const express = require('express');
const router = express.Router();
const messageController = require('../../controllers/messageController');
const { auth } = require('../../middleware/auth');
const { validate } = require('../../middleware/common');
const {
  sendMessageSchema,
  getMessagesQuerySchema,
  markAsReadSchema,
  conversationUserIdParamSchema,
  messageIdParamSchema
} = require('../../validators/message.validator');

router.get('/', auth, validate(getMessagesQuerySchema, 'query'), messageController.getMessages);
router.get('/conversations', auth, messageController.getConversations);
router.get('/unread-count', auth, messageController.getUnreadCount);
router.get('/conversation/:userId', auth, validate(conversationUserIdParamSchema, 'params'), messageController.getConversationByUser);
router.post('/', auth, validate(sendMessageSchema), messageController.sendNewMessage);
router.put('/read', auth, validate(markAsReadSchema), messageController.markAsRead);
router.put('/read/:userId', auth, validate(conversationUserIdParamSchema, 'params'), messageController.markConversationAsRead);
router.delete('/:messageId', auth, validate(messageIdParamSchema, 'params'), messageController.deleteMessage);
router.delete('/conversation/:userId', auth, validate(conversationUserIdParamSchema, 'params'), messageController.deleteConversation);

module.exports = router;
