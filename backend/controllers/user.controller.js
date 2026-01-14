const User = require('../models/User');
const Topic = require('../models/Topic');
const Reply = require('../models/Reply');
const Activity = require('../models/Activity');

class UserController {
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, role } = req.query;

      const users = User.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        role
      });

      const total = User.getCount(role);

      res.json({
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          muted_until: user.muted_until,
          banned: user.banned,
          created_at: user.created_at,
          last_login: user.last_login
        })),
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Kullanıcılar getirilirken hata oluştu' });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = User.findById(id);

      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        muted_until: user.muted_until,
        banned: user.banned,
        created_at: user.created_at,
        last_login: user.last_login
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Kullanıcı getirilirken hata oluştu' });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { avatar, bio } = req.body;

      // Check if user can update this profile
      if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Bu profili güncelleme yetkiniz yok' });
      }

      const user = User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      const updates = {};
      if (avatar !== undefined) updates.avatar = avatar;
      if (bio !== undefined) updates.bio = bio;

      const updatedUser = User.update(id, updates);

      // Log activity
      Activity.create({
        user_id: req.user.id,
        action: 'update_profile',
        target_type: 'user',
        target_id: id
      });

      res.json({
        message: 'Profil güncellendi',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio
        }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Profil güncellenirken hata oluştu' });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user can delete this account
      if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Bu hesabı silme yetkiniz yok' });
      }

      const user = User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      // Delete user (cascades to topics, replies, activities)
      User.delete(id);

      res.json({ message: 'Kullanıcı silindi' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Kullanıcı silinirken hata oluştu' });
    }
  }

  async getUserTopics(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const user = User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      const topics = Topic.getAll({
        author_id: id,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      const total = Topic.getCount(null, id);

      res.json({
        topics,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Get user topics error:', error);
      res.status(500).json({ error: 'Konular getirilirken hata oluştu' });
    }
  }

  async getUserReplies(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const user = User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      const replies = Reply.getByAuthor(id, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      const total = Reply.getCountByAuthor(id);

      res.json({
        replies,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Get user replies error:', error);
      res.status(500).json({ error: 'Yanıtlar getirilirken hata oluştu' });
    }
  }

  async getUserStats(req, res) {
    try {
      const { id } = req.params;

      const user = User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      const stats = Activity.getUserStats(id);
      const topicCount = Topic.getCount(null, id);
      const replyCount = Reply.getCountByAuthor(id);

      res.json({
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          created_at: user.created_at
        },
        stats: {
          topics_created: topicCount,
          replies_created: replyCount,
          total_logins: stats.total_logins
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: 'İstatistikler getirilirken hata oluştu' });
    }
  }

  async getRecentUsers(req, res) {
    try {
      const { limit = 5 } = req.query;

      const users = User.getRecent(parseInt(limit));

      res.json({
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          created_at: user.created_at
        }))
      });
    } catch (error) {
      console.error('Get recent users error:', error);
      res.status(500).json({ error: 'Yeni üyeler getirilirken hata oluştu' });
    }
  }
}

module.exports = new UserController();