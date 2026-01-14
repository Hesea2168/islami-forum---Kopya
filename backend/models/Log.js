const { getDatabase } = require('../config/database');

class Log {
  static create(logData) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO logs (action, admin_id, admin_name, target_id, target_name, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      logData.action,
      logData.admin_id,
      logData.admin_name,
      logData.target_id || null,
      logData.target_name || null,
      logData.details || null
    );

    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM logs WHERE id = ?');
    return stmt.get(id);
  }

  static getAll(options = {}) {
    const db = getDatabase();
    const { page = 1, limit = 50, action, admin_id } = options;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM logs WHERE 1=1';
    const params = [];

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }
    if (admin_id) {
      query += ' AND admin_id = ?';
      params.push(admin_id);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static getCount(action = null, admin_id = null) {
    const db = getDatabase();
    let query = 'SELECT COUNT(*) as count FROM logs WHERE 1=1';
    const params = [];

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }
    if (admin_id) {
      query += ' AND admin_id = ?';
      params.push(admin_id);
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params);
    return result.count;
  }

  static getRecent(limit = 20) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM logs
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  static getByAdmin(adminId, limit = 50, offset = 0) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM logs
      WHERE admin_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(adminId, limit, offset);
  }

  static getByAction(action, limit = 50, offset = 0) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM logs
      WHERE action = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(action, limit, offset);
  }

  static getByTarget(targetId, limit = 50, offset = 0) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM logs
      WHERE target_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(targetId, limit, offset);
  }

  static deleteOld(daysToKeep = 90) {
    const db = getDatabase();
    const cutoffTime = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);
    const stmt = db.prepare('DELETE FROM logs WHERE created_at < ?');
    return stmt.run(cutoffTime);
  }

  static deleteAll() {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM logs');
    return stmt.run();
  }
}

module.exports = Log;