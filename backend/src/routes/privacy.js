const express = require('express');
const router = express.Router();
const privacyController = require('../controllers/privacyController');
const { auth } = require('../middleware/auth');

router.post('/call/initiate', auth, privacyController.initiateCall);
router.post('/call/end', auth, privacyController.endCall);
router.post('/message/send', auth, privacyController.sendMessage);
router.get('/message/conversation/:userId', auth, privacyController.getConversation);
router.get('/masked-phone/:userId', auth, privacyController.getMaskedPhone);
router.post('/sos/alert', auth, privacyController.sosAlert);
router.get('/sos/history', auth, privacyController.getSOSHistory);
router.get('/settings', auth, privacyController.getPrivacySettings);
router.put('/settings', auth, privacyController.updatePrivacySettings);
router.get('/profile-visibility', auth, privacyController.getProfileVisibility);
router.put('/profile-visibility', auth, privacyController.updateProfileVisibility);

module.exports = router;
