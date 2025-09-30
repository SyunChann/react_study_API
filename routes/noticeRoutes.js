const express = require('express');
const router = express.Router();
const { createNotice,getAllNotices,getNoticeById,updateNotice,deleteNotice} = require('../controllers/noticeController');

router.post('/notice',createNotice);
router.put('/notice/',getAllNotices)
router.get('/notice/:id',getNoticeById);
router.patch('/notice/:id',updateNotice);
router.delete('/notice/:id',deleteNotice);

module.exports = router;

