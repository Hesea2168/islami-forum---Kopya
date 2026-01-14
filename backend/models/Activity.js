const { getDatabase } = require('../config/database');

class Activity {
  static create(activityData) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO activities (user_id, action, target_type, target_id)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      activityData.user_id,
      activityData.action,
      activityData.target_type || null,
      activityData.target_id || null
    );

    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM activities WHERE id = ?');
    return stmt.get(id);
  }

  static getByUser(userId, options = {}) {
    const db = getDatabase();
    const { page = 1, limit = 50, action } = options;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM activities WHERE user_id = ?';
    const params = [userId];

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static getCountByUser(userId, action = null) {
    const db = getDatabase();
    let query = 'SELECT COUNT(*) as count FROM activities WHERE user_id = ?';
    const params = [userId];

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params);
    return result.count;
  }

  static getRecent(limit = 20) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT a.*, u.username
      FROM activities a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  static getByAction(action, limit = 50, offset = 0) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM activities
      WHERE action = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(action, limit, offset);
  }

  static getUserStats(userId) {
    const db = getDatabase();
    
    const topicsStmt = db.prepare(`
      SELECT COUNT(*) as count FROM activities 
      WHERE user_id = ? AND action = 'create_topic'
    `);
    const topics = topicsStmt.get(userId);

    const repliesStmt = db.prepare(`
      SELECT COUNT(*) as count FROM activities 
      WHERE user_id = ? AND action = 'create_reply'
    `);
    const replies = repliesStmt.get(userId);

    const loginsStmt = db.prepare(`
      SELECT COUNT(*) as count FROM activities 
      WHERE user_id = ? AND action = 'login'
    `);
    const logins = loginsStmt.get(userId);

    return {
      topics_created: topics.count,
      replies_created: replies.count,
      total_logins: logins.count
    };
  }

  static deleteByUser(userId) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM activities WHERE user_id = ?');
    return stmt.run(userId);
  }

  static deleteOld(daysToKeep = 180) {
    const db = getDatabase();
    const cutoffTime = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);
    const stmt = db.prepare('DELETE FROM activities WHERE created_at < ?');
    return stmt.run(cutoffTime);
  }

  static deleteAll() {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM activities');
    return stmt.run();
  }

  static getActiveUsers(days = 7, limit = 10) {
    const db = getDatabase();
    const cutoffTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.avatar, COUNT(a.id) as activity_count
      FROM users u
      JOIN activities a ON u.id = a.user_id
      WHERE a.created_at > ?
      GROUP BY u.id
      ORDER BY activity_count DESC
      LIMIT ?
    `);
    
    return stmt.all(cutoffTime, limit);
  }
}

module.exports = Activity;