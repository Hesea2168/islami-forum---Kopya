const User = require('../models/User');
const Activity = require('../models/Activity');
const { hashPassword, comparePassword } = require('../utils/encryption');
const { generateToken, verifyToken } = require('../utils/token');

class AuthController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
      }

      const existingEmail = User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanılıyor' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = User.create({
        username,
        email,
        password: hashedPassword,
        role: 'user'
      });

      // Log activity
      Activity.create({
        user_id: user.id,
        action: 'register',
        target_type: 'user',
        target_id: user.id
      });

      // Generate token
      const token = generateToken(user.id);

      res.status(201).json({
        message: 'Kayıt başarılı',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio
        },
        token
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu' });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Find user
      const user = User.findByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
      }

      // Check if banned
      if (user.banned) {
        return res.status(403).json({ error: 'Hesabınız yasaklanmış' });
      }

      // Verify password
      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
      }

      // Update last login
      User.updateLastLogin(user.id);

      // Log activity
      Activity.create({
        user_id: user.id,
        action: 'login',
        target_type: 'user',
        target_id: user.id
      });

      // Generate token
      const token = generateToken(user.id);

      res.json({
        message: 'Giriş başarılı',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          muted_until: user.muted_until
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Giriş sırasında bir hata oluştu' });
    }
  }

  async logout(req, res) {
    try {
      // Optional: Log activity if user is authenticated
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (decoded) {
          Activity.create({
            user_id: decoded.userId,
            action: 'logout',
            target_type: 'user',
            target_id: decoded.userId
          });
        }
      }

      res.json({ message: 'Çıkış başarılı' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Çıkış sırasında bir hata oluştu' });
    }
  }

  async verify(req, res) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token bulunamadı' });
      }

      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
      }

      const user = User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
      }

      if (user.banned) {
        return res.status(403).json({ error: 'Hesabınız yasaklanmış' });
      }

      res.json({
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          muted_until: user.muted_until
        }
      });
    } catch (error) {
      console.error('Verify error:', error);
      res.status(500).json({ error: 'Token doğrulama hatası' });
    }
  }
}

module.exports = new AuthController();