const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'forum.db');

function setupDatabase() {
  return new Promise((resolve, reject) => {
    try {
      // Ensure database directory exists
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Ensure backups directory exists
      const backupDir = path.join(dbDir, 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const db = new Database(DB_PATH);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');

      // Users table
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user' CHECK(role IN ('user', 'moderator', 'admin')),
          avatar TEXT,
          bio TEXT,
          muted_until INTEGER DEFAULT 0,
          banned INTEGER DEFAULT 0,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          last_login INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);

      // Topics table
      db.exec(`
        CREATE TABLE IF NOT EXISTS topics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT NOT NULL,
          author_id INTEGER NOT NULL,
          author_name TEXT NOT NULL,
          views INTEGER DEFAULT 0,
          pinned INTEGER DEFAULT 0,
          locked INTEGER DEFAULT 0,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now')),
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Replies table
      db.exec(`
        CREATE TABLE IF NOT EXISTS replies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          topic_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          author_id INTEGER NOT NULL,
          author_name TEXT NOT NULL,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Logs table
      db.exec(`
        CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          action TEXT NOT NULL,
          admin_id INTEGER NOT NULL,
          admin_name TEXT NOT NULL,
          target_id INTEGER,
          target_name TEXT,
          details TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Activities table
      db.exec(`
        CREATE TABLE IF NOT EXISTS activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          target_type TEXT,
          target_id INTEGER,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create indexes for better performance
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);
        CREATE INDEX IF NOT EXISTS idx_topics_author ON topics(author_id);
        CREATE INDEX IF NOT EXISTS idx_topics_created ON topics(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_replies_topic ON replies(topic_id);
        CREATE INDEX IF NOT EXISTS idx_replies_author ON replies(author_id);
        CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
        CREATE INDEX IF NOT EXISTS idx_logs_admin ON logs(admin_id);
      `);

      db.close();
      console.log('✅ Database initialized successfully');
      resolve();
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      reject(error);
    }
  });
}

// Run if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { setupDatabase };