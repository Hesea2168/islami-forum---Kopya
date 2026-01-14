const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function formatDate() {
  return new Date().toISOString();
}

function log(level, message, data = null) {
  const timestamp = formatDate();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  // Console output
  console.log(logMessage);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }

  // File output
  try {
    let fileMessage = logMessage;
    if (data) {
      fileMessage += '\n' + JSON.stringify(data, null, 2);
    }
    fileMessage += '\n';

    fs.appendFileSync(LOG_FILE, fileMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

function info(message, data = null) {
  log('INFO', message, data);
}

function warn(message, data = null) {
  log('WARN', message, data);
}

function error(message, data = null) {
  log('ERROR', message, data);
}

function debug(message, data = null) {
  if (process.env.NODE_ENV === 'development') {
    log('DEBUG', message, data);
  }
}

function clearOldLogs(daysToKeep = 7) {
  try {
    const files = fs.readdirSync(LOG_DIR);
    const now = Date.now();
    const cutoffTime = daysToKeep * 24 * 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(LOG_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.birthtimeMs;

      if (fileAge > cutoffTime && file.endsWith('.log')) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old log: ${file}`);
      }
    });
  } catch (err) {
    console.error('Failed to clear old logs:', err);
  }
}

// Rotate logs daily
function rotateLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      const date = new Date(stats.birthtime).toISOString().split('T')[0];
      const rotatedFile = path.join(LOG_DIR, `app_${date}.log`);

      if (!fs.existsSync(rotatedFile)) {
        fs.renameSync(LOG_FILE, rotatedFile);
        info('Log file rotated');
      }
    }
  } catch (err) {
    console.error('Failed to rotate logs:', err);
  }
}

// Schedule daily log rotation and cleanup
setInterval(() => {
  rotateLogs();
  clearOldLogs(7);
}, 24 * 60 * 60 * 1000); // Every 24 hours

module.exports = {
  info,
  warn,
  error,
  debug,
  clearOldLogs,
  rotateLogs
};