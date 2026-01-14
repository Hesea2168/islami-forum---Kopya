const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error('Hash password error:', error);
    throw new Error('Şifre hashleme hatası');
  }
}

async function comparePassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Compare password error:', error);
    throw new Error('Şifre karşılaştırma hatası');
  }
}

module.exports = {
  hashPassword,
  comparePassword
};