const User = require('../models/User');
const Topic = require('../models/Topic');
const Reply = require('../models/Reply');
const Log = require('../models/Log');
const Activity = require('../models/Activity');
const { createBackup, getBackupList, restoreFromBackup } = require('../utils/backup');

class AdminController {
  async getLogs(req, res) {
    try {
      const { page = 1, limit = 50, action, admin_id } = req.query;

      const logs = Log.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        action,
        admin_id: admin_id ? parseInt(admin_id) : null
      });

      const total = Log.getCount(action, admin_id ? parseInt(admin_id) : null);

      res.json({
        logs,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Get logs error:', error);
      res.status(500).json({ error: 'Loglar getirilirken hata oluştu' });
    }
  }

  async getStats(req, res) {
    try {
      const totalUsers = User.getCount();
      const totalTopics = Topic.getCount();
      const totalReplies = Reply.getCountByTopic ? 0 : 0; // Need to implement global count
      
      // Count total replies
      const { getDatabase } = require('../config/database');
      const db = getDatabase();
      const replyCountStmt = db.prepare('SELECT COUNT(*) as count FROM replies');
      const replyResult = replyCountStmt.get();

      const recentUsers = User.getRecent(5);
      const hotTopics = Topic.getHot(5);
      const activeUsers = Activity.getActiveUsers(7, 10);

      res.json({
        stats: {
          total_users: totalUsers,
          total_topics: totalTopics,
          total_replies: replyResult.count
        },
        recent_users: recentUsers,
        hot_topics: hotTopics,
        active_users: activeUsers
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'İstatistikler getirilirken hata oluştu' });
    }
  }

  async muteUser(req, res) {
    try {
      const { id } = req.params;
      const { duration = 60 } = req.body; // duration in minutes

      const user = User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      if (user.role === 'admin') {
        return res.status(403).json({ error: 'Admin kullanıcıları susturulamaz' });
      }

      const mutedUntil = Math.floor(Date.now() / 1000) + (duration * 60);
      User.update(id, { muted_until: mutedUntil });

      // Log action
      Log.create({
        action: 'mute_user',
        admin_id: req.user.id,
        admin_name: req.user.username,
        target_id: id,
        target_name: user.username,
        details: `${duration} dakika susturuldu`
      });

      res.json({ 
        message: `Kullanıcı ${duration} dakika susturuldu`,
        muted_until: mutedUntil
      });
    } catch (error) {
      console.error('Mute user error:', error);
      res.status(500).json({ error: 'Kullanıcı susturulurken hata oluştu' });
    }
  }

  async unmuteUser(req, res) {
    try {
      const { id } = req.params;

      const user = User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      User.update(id, { muted_until: 0 });

      // Log action
      Log.create({
        action: 'unmute_user',
        admin_id: req.user.id,
        admin_name: req.user.username,
        target_id: id,
        target_name: user.username
      });

      res.json({ message: 'Susturma kaldırıldı' });
    } catch (error) {
      console.error('Unmute user error:', error);
      res.status(500).json({ error: 'Susturma kaldırılırken hata oluştu' });
    }
  }

  async banUser(req, res) {
    try {
      const { id } = req.params;

      const user = User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      if (user.role === 'admin') {
        return res.status(403).json({ error: 'Admin kullanıcıları yasaklanamaz' });
      }

      User.update(id, { banned: 1 });

      // Log action
      Log.create({
        action: 'ban_user',
        admin_id: req.user.id,
        admin_name: req.user.username,
        target_id: id,
        target_name: user.username
      });

      res.json({ message: 'Kullanıcı yasaklandı' });
    } catch (error) {
      console.error('Ban user error:', error);
      res.status(500).json({ error: 'Kullanıcı yasaklanırken hata oluştu' });
    }
  }

  async unbanUser(req, res) {
    try {
      const { id } = req.params;

      const user = User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      User.update(id, { banned: 0 });

      // Log action
      Log.create({
        action: 'unban_user',
        admin_id: req.user.id,
        admin_name: req.user.username,
        target_id: id,
        target_name: user.username
      });

      res.json({ message: 'Yasak kaldırıldı' });
    } catch (error) {
      console.error('Unban user error:', error);
      res.status(500).json({ error: 'Yasak kaldırılırken hata oluştu' });
    }
  }

  async promoteToModerator(req, res) {
    try {
      const { id } = req.params;

      const user = User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      if (user.role === 'admin') {
        return res.status(400).json({ error: 'Kullanıcı zaten admin' });
      }

      User.update(id, { role: 'moderator' });

      // Log action
      Log.create({
        action: 'promote_moderator',
        admin_id: req.user.id,
        admin_name: req.user.username,
        target_id: id,
        target_name: user.username
      });

      res.json({ message: 'Kullanıcı moderatör yapıldı' });
    } catch (error) {
      console.error('Promote user error:', error);
      res.status(500).json({ error: 'Yetki yükseltilirken hata oluştu' });
    }
  }

  async demoteFromModerator(req, res) {
    try {
      const { id } = req.params;

      const user = User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      if (user.role === 'admin') {
        return res.status(403).json({ error: 'Admin yetkisi kaldırılamaz' });
      }

      User.update(id, { role: 'user' });

      // Log action
      Log.create({
        action: 'demote_moderator',
        admin_id: req.user.id,
        admin_name: req.user.username,
        target_id: id,
        target_name: user.username
      });

      res.json({ message: 'Moderatör yetkisi kaldırıldı' });
    } catch (error) {
      console.error('Demote user error:', error);
      res.status(500).json({ error: 'Yetki düşürülürken hata oluştu' });
    }
  }

  async deleteTopic(req, res) {
    try {
      const { id } = req.params;

      const topic = Topic.findById(id);
      if (!topic) {
        return res.status(404).json({ error: 'Konu bulunamadı' });
      }

      Topic.delete(id);

      // Log action
      Log.create({
        action: 'delete_topic_admin',
        admin_id: req.user.id,
        admin_name: req.user.username,
        target_id: id,
        target_name: topic.title
      });

      res.json({ message: 'Konu silindi' });
    } catch (error) {
      console.error('Delete topic error:', error);
      res.status(500).json({ error: 'Konu silinirken hata oluştu' });
    }
  }

  async deleteReply(req, res) {
    try {
      const { id } = req.params;

      const reply = Reply.findById(id);
      if (!reply) {
        return res.status(404).json({ error: 'Yanıt bulunamadı' });
      }

      Reply.delete(id);

      // Log action
      Log.create({
        action: 'delete_reply_admin',
        admin_id: req.user.id,
        admin_name: req.user.username,
        target_id: id,
        target_name: reply.author_name
      });

      res.json({ message: 'Yanıt silindi' });
    } catch (error) {
      console.error('Delete reply error:', error);
      res.status(500).json({ error: 'Yanıt silinirken hata oluştu' });
    }
  }

  async createBackup(req, res) {
    try {
      const filename = await createBackup();

      // Log action
      Log.create({
        action: 'create_backup',
        admin_id: req.user.id,
        admin_name: req.user.username,
        details: filename
      });

      res.json({ 
        message: 'Yedek oluşturuldu',
        filename 
      });
    } catch (error) {
      console.error('Create backup error:', error);
      res.status(500).json({ error: 'Yedek oluşturulurken hata oluştu' });
    }
  }

  async getBackups(req, res) {
    try {
      const backups = await getBackupList();

      res.json({ backups });
    } catch (error) {
      console.error('Get backups error:', error);
      res.status(500).json({ error: 'Yedekler getirilirken hata oluştu' });
    }
  }

  async restoreBackup(req, res) {
    try {
      const { filename } = req.params;

      await restoreFromBackup(filename);

      // Log action
      Log.create({
        action: 'restore_backup',
        admin_id: req.user.id,
        admin_name: req.user.username,
        details: filename
      });

      res.json({ 
        message: 'Yedek geri yüklendi',
        filename 
      });
    } catch (error) {
      console.error('Restore backup error:', error);
      res.status(500).json({ error: 'Yedek geri yüklenirken hata oluştu' });
    }
  }
}

module.exports = new AdminController();