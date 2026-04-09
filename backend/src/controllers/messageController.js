const { messageService } = require('../services');
const { ApiResponse, PaginatedResponse } = require('../dto');

exports.getMessages = async (req, res, next) => {
  try {
    const { userId, ridePoolId, page = 1, limit = 50 } = req.query;
    const messages = await messageService.getMessages(req.user._id, { userId, ridePoolId, page, limit });
    res.json(ApiResponse.success({ messages: messages.reverse() }));
  } catch (error) {
    next(error);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await messageService.getConversations(req.user._id);
    res.json(ApiResponse.success({ conversations }));
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await messageService.markAsRead(req.user._id, userId);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const result = await messageService.getUnreadCount(req.user._id);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

exports.getConversationByUser = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const messages = await messageService.getConversation(req.params.userId, { page, limit });
    const total = messages.length;
    res.json(PaginatedResponse.formatSimple(messages, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.sendNewMessage = async (req, res, next) => {
  try {
    const { receiverId, ridePoolId, content } = req.body;
    const message = await messageService.sendMessage(req.user._id, receiverId, content, ridePoolId);
    res.status(201).json(ApiResponse.created({ message }, 'Message sent'));
  } catch (error) {
    next(error);
  }
};

exports.markConversationAsRead = async (req, res, next) => {
  try {
    const result = await messageService.markAsRead(req.user._id, req.params.userId);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const result = await messageService.deleteMessage(req.params.messageId, req.user._id);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

exports.deleteConversation = async (req, res, next) => {
  try {
    const result = await messageService.deleteConversation(req.user._id, req.params.userId);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};
