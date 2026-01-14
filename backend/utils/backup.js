const fs = require('fs');
const path = require('path');
const { getDatabase, closeDatabase } = require('../config/database');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/forum.db');
const BACKUP_PATH = process.env.BACKUP_PATH || path.join(__dirname, '../database/backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_PATH)) {
  fs.mkdirSync(BACKUP_PATH, { recursive: true });
}

async function createBackup() {
  return new Promise((resolve, reject) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `forum_backup_${timestamp}.db`;
      const backupFile = path.join(BACKUP_PATH, filename);

      // Copy database file
      fs.copyFileSync(DB_PATH, backupFile);

      console.log(`✅ Backup created: ${filename}`);
      resolve(filename);
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      reject(error);
    }
  });
}

async function restoreFromBackup(filename) {
  return new Promise((resolve, reject) => {
    try {
      const backupFile = path.join(BACKUP_PATH, filename);

      if (!fs.existsSync(backupFile)) {
        throw new Error('Yedek dosyası bulunamadı');
      }

      // Close database connection
      closeDatabase();

      // Create backup of current database before restoring
      const currentBackup = `current_before_restore_${Date.now()}.db`;
      fs.copyFileSync(DB_PATH, path.join(BACKUP_PATH, currentBackup));

      // Restore backup
      fs.copyFileSync(backupFile, DB_PATH);

      console.log(`✅ Database restored from: ${filename}`);
      resolve();
    } catch (error) {
      console.error('❌ Restore failed:', error);
      reject(error);
    }
  });
}

function getBackupList() {
  return new Promise((resolve, reject) => {
    try {
      const files = fs.readdirSync(BACKUP_PATH);
      const backups = files
        .filter(file => file.endsWith('.db'))
        .map(file => {
          const stats = fs.statSync(path.join(BACKUP_PATH, file));
          return {
            filename: file,
            size: stats.size,
            created_at: stats.birthtime.toISOString()
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      resolve(backups);
    } catch (error) {
      console.error('❌ Failed to get backup list:', error);
      reject(error);
    }
  });
}

function deleteOldBackups(daysToKeep = 30) {
  try {
    const files = fs.readdirSync(BACKUP_PATH);
    const now = Date.now();
    const cutoffTime = daysToKeep * 24 * 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(BACKUP_PATH, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.birthtimeMs;

      if (fileAge > cutoffTime && file.endsWith('.db')) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted old backup: ${file}`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to delete old backups:', error);
  }
}

function startBackupSchedule() {
  // Create backup every 6 hours
  const SIX_HOURS = 6 * 60 * 60 * 1000;

  setInterval(async () => {
    try {
      await createBackup();
      deleteOldBackups(30); // Keep backups for 30 days
    } catch (error) {
      console.error('Scheduled backup failed:', error);
    }
  }, SIX_HOURS);

  // Create initial backup on startup
  createBackup().catch(err => console.error('Initial backup failed:', err));
}

module.exports = {
  createBackup,
  restoreFromBackup,
  getBackupList,
  deleteOldBackups,
  startBackupSchedule
};