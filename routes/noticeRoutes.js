const noticeController = require('./../controllers/noticeController');

app.post('/api/notice',noticeController.createNotice);
app.get('/api/notice',noticeController.getAllNotices);
app.get('/api/notice/:id',noticeController.getNoticeById);
app.patch('/api/notice/:id',noticeController.updateNotice);
app.delete('/api/notice/:id',noticeController.deleteNotice);