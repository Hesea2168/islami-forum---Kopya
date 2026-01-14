const { getDatabase } = require('../config/database');

class Reply {
  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM replies WHERE id = ?');
    return stmt.get(id);
  }

  static create(replyData) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO replies (topic_id, content, author_id, author_name)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      replyData.topic_id,
      replyData.content,
      replyData.author_id,
      replyData.author_name
    );

    // Update topic's updated_at timestamp
    const updateTopicStmt = db.prepare('UPDATE topics SET updated_at = ? WHERE id = ?');
    updateTopicStmt.run(Math.floor(Date.now() / 1000), replyData.topic_id);

    return this.findById(result.lastInsertRowid);
  }

  static update(id, content) {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE replies SET content = ? WHERE id = ?');
    stmt.run(content, id);
    return this.findById(id);
  }

  static delete(id) {
    const db = getDatabase();
    const reply = this.findById(id);
    
    if (reply) {
      const stmt = db.prepare('DELETE FROM replies WHERE id = ?');
      stmt.run(id);

      // Update topic's updated_at timestamp
      const updateTopicStmt = db.prepare('UPDATE topics SET updated_at = ? WHERE id = ?');
      updateTopicStmt.run(Math.floor(Date.now() / 1000), reply.topic_id);
    }

    return reply;
  }

  static getByTopic(topicId, options = {}) {
    const db = getDatabase();
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const stmt = db.prepare(`
      SELECT * FROM replies
      WHERE topic_id = ?
      ORDER BY created_at ASC
      LIMIT ? OFFSET ?
    `);
    
    return stmt.all(topicId, limit, offset);
  }

  static getCountByTopic(topicId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM replies WHERE topic_id = ?');
    const result = stmt.get(topicId);
    return result.count;
  }

  static getByAuthor(authorId, options = {}) {
    const db = getDatabase();
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const stmt = db.prepare(`
      SELECT * FROM replies
      WHERE author_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    
    return stmt.all(authorId, limit, offset);
  }

  static getCountByAuthor(authorId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM replies WHERE author_id = ?');
    const result = stmt.get(authorId);
    return result.count;
  }

  static getRecent(limit = 10) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT r.*, t.title as topic_title
      FROM replies r
      JOIN topics t ON r.topic_id = t.id
      ORDER BY r.created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  static deleteByTopic(topicId) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM replies WHERE topic_id = ?');
    return stmt.run(topicId);
  }

  static deleteByAuthor(authorId) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM replies WHERE author_id = ?');
    return stmt.run(authorId);
  }
}

module.exports = Reply;