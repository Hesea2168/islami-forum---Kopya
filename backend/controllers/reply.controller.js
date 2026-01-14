const Reply = require('../models/Reply');
const Topic = require('../models/Topic');
const User = require('../models/User');
const Activity = require('../models/Activity');

class ReplyController {
  async getRepliesByTopic(req, res) {
    try {
      const { topicId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const topic = Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({ error: 'Konu bulunamadı' });
      }

      const replies = Reply.getByTopic(topicId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      const total = Reply.getCountByTopic(topicId);

      res.json({
        replies,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Get replies error:', error);
      res.status(500).json({ error: 'Yanıtlar getirilirken hata oluştu' });
    }
  }

  async getReplyById(req, res) {
    try {
      const { id } = req.params;

      const reply = Reply.findById(id);

      if (!reply) {
        return res.status(404).json({ error: 'Yanıt bulunamadı' });
      }

      res.json(reply);
    } catch (error) {
      console.error('Get reply error:', error);
      res.status(500).json({ error: 'Yanıt getirilirken hata oluştu' });
    }
  }

  async createReply(req, res) {
    try {
      const { topicId } = req.params;
      const { content } = req.body;

      // Check if topic exists
      const topic = Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({ error: 'Konu bulunamadı' });
      }

      // Check if topic is locked
      if (topic.locked) {
        return res.status(403).json({ error: 'Bu konu kilitli, yanıt yazamazsınız' });
      }

      // Check if user is muted
      if (User.isMuted(req.user.id)) {
        const mutedUntil = User.getMutedUntil(req.user.id);
        const now = Math.floor(Date.now() / 1000);
        const remainingMinutes = Math.ceil((mutedUntil - now) / 60);
        return res.status(403).json({ 
          error: `Susturulduğunuz için yanıt yazamazsınız. Kalan süre: ${remainingMinutes} dakika` 
        });
      }

      const reply = Reply.create({
        topic_id: topicId,
        content,
        author_id: req.user.id,
        author_name: req.user.username
      });

      // Log activity
      Activity.create({
        user_id: req.user.id,
        action: 'create_reply',
        target_type: 'reply',
        target_id: reply.id
      });

      res.status(201).json({
        message: 'Yanıt oluşturuldu',
        reply
      });
    } catch (error) {
      console.error('Create reply error:', error);
      res.status(500).json({ error: 'Yanıt oluşturulurken hata oluştu' });
    }
  }

  async updateReply(req, res) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      const reply = Reply.findById(id);

      if (!reply) {
        return res.status(404).json({ error: 'Yanıt bulunamadı' });
      }

      // Check if user can update this reply
      if (reply.author_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Bu yanıtı düzenleme yetkiniz yok' });
      }

      // Check if topic is locked
      const topic = Topic.findById(reply.topic_id);
      if (topic && topic.locked && req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Bu konu kilitli' });
      }

      const updatedReply = Reply.update(id, content);

      // Log activity
      Activity.create({
        user_id: req.user.id,
        action: 'update_reply',
        target_type: 'reply',
        target_id: id
      });

      res.json({
        message: 'Yanıt güncellendi',
        reply: updatedReply
      });
    } catch (error) {
      console.error('Update reply error:', error);
      res.status(500).json({ error: 'Yanıt güncellenirken hata oluştu' });
    }
  }

  async deleteReply(req, res) {
    try {
      const { id } = req.params;

      const reply = Reply.findById(id);

      if (!reply) {
        return res.status(404).json({ error: 'Yanıt bulunamadı' });
      }

      // Check if user can delete this reply
      if (reply.author_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Bu yanıtı silme yetkiniz yok' });
      }

      Reply.delete(id);

      // Log activity
      Activity.create({
        user_id: req.user.id,
        action: 'delete_reply',
        target_type: 'reply',
        target_id: id
      });

      res.json({ message: 'Yanıt silindi' });
    } catch (error) {
      console.error('Delete reply error:', error);
      res.status(500).json({ error: 'Yanıt silinirken hata oluştu' });
    }
  }

  async getRecentReplies(req, res) {
    try {
      const { limit = 10 } = req.query;

      const replies = Reply.getRecent(parseInt(limit));

      res.json({ replies });
    } catch (error) {
      console.error('Get recent replies error:', error);
      res.status(500).json({ error: 'Son yanıtlar getirilirken hata oluştu' });
    }
  }
}

module.exports = new ReplyController();