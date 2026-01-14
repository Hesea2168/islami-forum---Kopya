const { getDatabase } = require('../config/database');

class User {
  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static findByUsername(username) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static findByEmail(email) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  static create(userData) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password, role, avatar, bio)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      userData.username,
      userData.email,
      userData.password,
      userData.role || 'user',
      userData.avatar || '',
      userData.bio || ''
    );

    return this.findById(result.lastInsertRowid);
  }

  static update(id, updates) {
    const db = getDatabase();
    const fields = [];
    const values = [];

    if (updates.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(updates.avatar);
    }
    if (updates.bio !== undefined) {
      fields.push('bio = ?');
      values.push(updates.bio);
    }
    if (updates.role !== undefined) {
      fields.push('role = ?');
      values.push(updates.role);
    }
    if (updates.muted_until !== undefined) {
      fields.push('muted_until = ?');
      values.push(updates.muted_until);
    }
    if (updates.banned !== undefined) {
      fields.push('banned = ?');
      values.push(updates.banned);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.findById(id);
  }

  static updateLastLogin(id) {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE users SET last_login = ? WHERE id = ?');
    stmt.run(Math.floor(Date.now() / 1000), id);
  }

  static delete(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
  }

  static getAll(options = {}) {
    const db = getDatabase();
    const { page = 1, limit = 20, role } = options;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, username, email, role, avatar, bio, muted_until, banned, created_at, last_login FROM users';
    const params = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static getCount(role = null) {
    const db = getDatabase();
    let query = 'SELECT COUNT(*) as count FROM users';
    const params = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params);
    return result.count;
  }

  static getRecent(limit = 5) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, username, avatar, created_at 
      FROM users 
      WHERE banned = 0
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  static isMuted(id) {
    const user = this.findById(id);
    if (!user) return false;
    
    const now = Math.floor(Date.now() / 1000);
    return user.muted_until > now;
  }

  static getMutedUntil(id) {
    const user = this.findById(id);
    return user ? user.muted_until : 0;
  }
}

module.exports = User;