const Topic = require('../models/Topic');
const Reply = require('../models/Reply');
const User = require('../models/User');
const Activity = require('../models/Activity');

class TopicController {
  async getAllTopics(req, res) {
    try {
      const { page = 1, limit = 20, category, author_id, pinned } = req.query;

      const topics = Topic.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        author_id: author_id ? parseInt(author_id) : null,
        pinned: pinned !== undefined ? parseInt(pinned) : undefined
      });

      // Get reply counts for each topic
      const topicsWithReplies = topics.map(topic => ({
        ...topic,
        reply_count: Topic.getReplyCount(topic.id)
      }));

      const total = Topic.getCount(category, author_id ? parseInt(author_id) : null);

      res.json({
        topics: topicsWithReplies,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Get all topics error:', error);
      res.status(500).json({ error: 'Konular getirilirken hata oluştu' });
    }
  }

  async getTopicById(req, res) {
    try {
      const { id } = req.params;

      const topic = Topic.findById(id);

      if (!topic) {
        return res.status(404).json({ error: 'Konu bulunamadı' });
      }

      // Increment views
      Topic.incrementViews(id);

      // Get reply count
      const replyCount = Topic.getReplyCount(id);

      res.json({
        ...topic,
        reply_count: replyCount
      });
    } catch (error) {
      console.error('Get topic error:', error);
      res.status(500).json({ error: 'Konu getirilirken hata oluştu' });
    }
  }

  async createTopic(req, res) {
    try {
      const { title, content, category } = req.body;

      // Check if user is muted
      if (User.isMuted(req.user.id)) {
        const mutedUntil = User.getMutedUntil(req.user.id);
        const now = Math.floor(Date.now() / 1000);
        const remainingMinutes = Math.ceil((mutedUntil - now) / 60);
        return res.status(403).json({ 
          error: `Susturulduğunuz için konu açamazsınız. Kalan süre: ${remainingMinutes} dakika` 
        });
      }

      const topic = Topic.create({
        title,
        content,
        category,
        author_id: req.user.id,
        author_name: req.user.username
      });

      // Log activity
      Activity.create({
        user_id: req.user.id,
        action: 'create_topic',
        target_type: 'topic',
        target_id: topic.id
      });

      res.status(201).json({
        message: 'Konu oluşturuldu',
        topic: {
          ...topic,
          reply_count: 0
        }
      });
    } catch (error) {
      console.error('Create topic error:', error);
      res.status(500).json({ error: 'Konu oluşturulurken hata oluştu' });
    }
  }

  async updateTopic(req, res) {
    try {
      const { id } = req.params;
      const { title, content, category } = req.body;

      const topic = Topic.findById(id);

      if (!topic) {
        return res.status(404).json({ error: 'Konu bulunamadı' });
      }

      // Check if user can update this topic
      if (topic.author_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Bu konuyu düzenleme yetkiniz yok' });
      }

      // Check if topic is locked
      if (topic.locked && req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Bu konu kilitli' });
      }

      const updates = {};
      if (title) updates.title = title;
      if (content) updates.content = content;
      if (category) updates.category = category;

      const updatedTopic = Topic.update(id, updates);

      // Log activity
      Activity.create({
        user_id: req.user.id,
        action: 'update_topic',
        target_type: 'topic',
        target_id: id
      });

      res.json({
        message: 'Konu güncellendi',
        topic: {
          ...updatedTopic,
          reply_count: Topic.getReplyCount(id)
        }
      });
    } catch (error) {
      console.error('Update topic error:', error);
      res.status(500).json({ error: 'Konu güncellenirken hata oluştu' });
    }
  }

  async deleteTopic(req, res) {
    try {
      const { id } = req.params;

      const topic = Topic.findById(id);

      if (!topic) {
        return res.status(404).json({ error: 'Konu bulunamadı' });
      }

      // Check if user can delete this topic
      if (topic.author_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Bu konuyu silme yetkiniz yok' });
      }

      Topic.delete(id);

      // Log activity
      Activity.create({
        user_id: req.user.id,
        action: 'delete_topic',
        target_type: 'topic',
        target_id: id
      });

      res.json({ message: 'Konu silindi' });
    } catch (error) {
      console.error('Delete topic error:', error);
      res.status(500).json({ error: 'Konu silinirken hata oluştu' });
    }
  }

  async togglePin(req, res) {
    try {
      const { id } = req.params;

      // Check moderator/admin permission
      if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const topic = Topic.findById(id);

      if (!topic) {
        return res.status(404).json({ error: 'Konu bulunamadı' });
      }

      const updatedTopic = Topic.update(id, { pinned: topic.pinned ? 0 : 1 });

      // Log activity
      Activity.create({
        user_id: req.user.id,
        action: topic.pinned ? 'unpin_topic' : 'pin_topic',
        target_type: 'topic',
        target_id: id
      });

      res.json({
        message: topic.pinned ? 'Konu sabitleme kaldırıldı' : 'Konu sabitlendi',
        topic: updatedTopic
      });
    } catch (error) {
      console.error('Toggle pin error:', error);
      res.status(500).json({ error: 'İşlem sırasında hata oluştu' });
    }
  }

  async toggleLock(req, res) {
    try {
      const { id } = req.params;

      // Check moderator/admin permission
      if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const topic = Topic.findById(id);

      if (!topic) {
        return res.status(404).json({ error: 'Konu bulunamadı' });
      }

      const updatedTopic = Topic.update(id, { locked: topic.locked ? 0 : 1 });

      // Log activity
      Activity.create({
        user_id: req.user.id,
        action: topic.locked ? 'unlock_topic' : 'lock_topic',
        target_type: 'topic',
        target_id: id
      });

      res.json({
        message: topic.locked ? 'Konu kilidi kaldırıldı' : 'Konu kilitlendi',
        topic: updatedTopic
      });
    } catch (error) {
      console.error('Toggle lock error:', error);
      res.status(500).json({ error: 'İşlem sırasında hata oluştu' });
    }
  }

  async getHotTopics(req, res) {
    try {
      const { limit = 5 } = req.query;

      const topics = Topic.getHot(parseInt(limit));

      res.json({ topics });
    } catch (error) {
      console.error('Get hot topics error:', error);
      res.status(500).json({ error: 'Popüler konular getirilirken hata oluştu' });
    }
  }

  async getRecentTopics(req, res) {
    try {
      const { limit = 10 } = req.query;

      const topics = Topic.getRecent(parseInt(limit));

      res.json({ topics });
    } catch (error) {
      console.error('Get recent topics error:', error);
      res.status(500).json({ error: 'Son konular getirilirken hata oluştu' });
    }
  }

  async searchTopics(req, res) {
    try {
      const { q, page = 1, limit = 20 } = req.query;

      if (!q) {
        return res.status(400).json({ error: 'Arama terimi gerekli' });
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const topics = Topic.search(q, parseInt(limit), offset);

      res.json({
        topics,
        query: q,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('Search topics error:', error);
      res.status(500).json({ error: 'Arama sırasında hata oluştu' });
    }
  }
}

module.exports = new TopicController();