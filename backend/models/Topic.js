const { getDatabase } = require('../config/database');

class Topic {
  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM topics WHERE id = ?');
    return stmt.get(id);
  }

  static create(topicData) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO topics (title, content, category, author_id, author_name, pinned, locked)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      topicData.title,
      topicData.content,
      topicData.category,
      topicData.author_id,
      topicData.author_name,
      topicData.pinned || 0,
      topicData.locked || 0
    );

    return this.findById(result.lastInsertRowid);
  }

  static update(id, updates) {
    const db = getDatabase();
    const fields = [];
    const values = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.pinned !== undefined) {
      fields.push('pinned = ?');
      values.push(updates.pinned);
    }
    if (updates.locked !== undefined) {
      fields.push('locked = ?');
      values.push(updates.locked);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = ?');
    values.push(Math.floor(Date.now() / 1000));
    values.push(id);

    const stmt = db.prepare(`UPDATE topics SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.findById(id);
  }

  static delete(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM topics WHERE id = ?');
    return stmt.run(id);
  }

  static incrementViews(id) {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE topics SET views = views + 1 WHERE id = ?');
    stmt.run(id);
  }

  static getAll(options = {}) {
    const db = getDatabase();
    const { page = 1, limit = 20, category, author_id, pinned } = options;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM topics WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (author_id) {
      query += ' AND author_id = ?';
      params.push(author_id);
    }
    if (pinned !== undefined) {
      query += ' AND pinned = ?';
      params.push(pinned);
    }

    query += ' ORDER BY pinned DESC, updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static getCount(category = null, author_id = null) {
    const db = getDatabase();
    let query = 'SELECT COUNT(*) as count FROM topics WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (author_id) {
      query += ' AND author_id = ?';
      params.push(author_id);
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params);
    return result.count;
  }

  static getHot(limit = 5) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT t.*, 
             (SELECT COUNT(*) FROM replies WHERE topic_id = t.id) as reply_count
      FROM topics t
      ORDER BY (t.views + reply_count * 2) DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  static getRecent(limit = 10) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM topics
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  static getByCategory(category, limit = 20, offset = 0) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM topics
      WHERE category = ?
      ORDER BY pinned DESC, updated_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(category, limit, offset);
  }

  static search(query, limit = 20, offset = 0) {
    const db = getDatabase();
    const searchTerm = `%${query}%`;
    const stmt = db.prepare(`
      SELECT * FROM topics
      WHERE title LIKE ? OR content LIKE ?
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(searchTerm, searchTerm, limit, offset);
  }

  static getReplyCount(topicId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM replies WHERE topic_id = ?');
    const result = stmt.get(topicId);
    return result.count;
  }
}

module.exports = Topic;