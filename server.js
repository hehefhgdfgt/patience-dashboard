const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration - UPDATE THESE WITH YOUR DISCORD BOT CREDENTIALS
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1497815572015218871';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'JnvjqcBpMF7tMqDoQzUxv4Soifu9lDjz';
const SESSION_SECRET = process.env.SESSION_SECRET || 'patience-secret-key-change-in-production';
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAADD_MauhB3QyttzVq0QSozic29M';

// MySQL Connection - uses Railway's MYSQL_URL
const MYSQL_URL = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
let db;
let useMySQL = false;

// JSON file fallback
const WHITELIST_FILE = path.join(__dirname, 'whitelist.json');

// Initialize JSON whitelist file if it doesn't exist
if (!fs.existsSync(WHITELIST_FILE)) {
  fs.writeFileSync(WHITELIST_FILE, JSON.stringify({
    admin: null,
    users: []
  }, null, 2));
}

// Load whitelist from JSON
function loadWhitelist() {
  if (fs.existsSync(WHITELIST_FILE)) {
    const data = JSON.parse(fs.readFileSync(WHITELIST_FILE, 'utf8'));
    return data;
  }
  return { admin: null, users: [] };
}

// Save whitelist to JSON
function saveWhitelist(whitelist) {
  fs.writeFileSync(WHITELIST_FILE, JSON.stringify(whitelist, null, 2));
}

// Initialize MySQL connection (optional)
async function initDB() {
  if (!MYSQL_URL) {
    console.log('No MYSQL_URL provided, using JSON file storage');
    return;
  }
  
  try {
    db = await mysql.createConnection(MYSQL_URL);
    console.log('MySQL connected successfully');
    useMySQL = true;
    
    // Create whitelist table if not exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS whitelist (
        discord_id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        added_by VARCHAR(255)
      )
    `);
    
    // Create user_configs table if not exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discord_id VARCHAR(255) NOT NULL,
        tab_name VARCHAR(255) NOT NULL,
        code TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_tab (discord_id, tab_name)
      )
    `);
    
    // Note: Admins should be added manually via admin panel or database
    
    console.log('Database initialized');
  } catch (err) {
    console.error('MySQL connection error, falling back to JSON storage:', err.message);
    useMySQL = false;
  }
}

// Check if user is whitelisted
async function isWhitelisted(discordId) {
  if (useMySQL) {
    const [rows] = await db.execute('SELECT discord_id FROM whitelist WHERE discord_id = ?', [discordId]);
    return rows.length > 0;
  } else {
    const whitelist = loadWhitelist();
    return whitelist.users.includes(discordId);
  }
}

// Check if user is admin (checks database for is_admin flag or specific entries)
async function isAdmin(discordId) {
  if (useMySQL) {
    // Check if user has 'admin' as username or is in a separate admin list
    const [rows] = await db.execute('SELECT discord_id FROM whitelist WHERE discord_id = ? AND username = ?', [discordId, 'admin']);
    return rows.length > 0;
  } else {
    const whitelist = loadWhitelist();
    return whitelist.admin === discordId;
  }
}

// Get all whitelisted users
async function getWhitelist() {
  if (useMySQL) {
    const [rows] = await db.execute('SELECT * FROM whitelist ORDER BY added_at DESC');
    // Get first admin from whitelist where username = 'admin'
    const [adminRows] = await db.execute('SELECT discord_id FROM whitelist WHERE username = ? LIMIT 1', ['admin']);
    const adminId = adminRows.length > 0 ? adminRows[0].discord_id : null;
    return { admin: adminId, users: rows };
  } else {
    return loadWhitelist();
  }
}

// Add user to whitelist
async function addToWhitelist(discordId, username, addedBy) {
  if (useMySQL) {
    try {
      await db.execute(
        'INSERT INTO whitelist (discord_id, username, added_by) VALUES (?, ?, ?)',
        [discordId, username, addedBy]
      );
      return true;
    } catch (err) {
      console.error('Error adding to whitelist:', err);
      return false;
    }
  } else {
    const whitelist = loadWhitelist();
    if (whitelist.users.includes(discordId)) return false;
    whitelist.users.push(discordId);
    saveWhitelist(whitelist);
    return true;
  }
}

// Remove user from whitelist
async function removeFromWhitelist(discordId) {
  // Check if user is admin (can't remove admins)
  if (await isAdmin(discordId)) return false;
  
  if (useMySQL) {
    try {
      await db.execute('DELETE FROM whitelist WHERE discord_id = ?', [discordId]);
      return true;
    } catch (err) {
      console.error('Error removing from whitelist:', err);
      return false;
    }
  } else {
    const whitelist = loadWhitelist();
    whitelist.users = whitelist.users.filter(id => id !== discordId);
    saveWhitelist(whitelist);
    return true;
  }
}

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname)));

// Passport Discord OAuth2 Strategy
const PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN || 'coach.fun';
const CALLBACK_URL = `https://${PUBLIC_DOMAIN}/auth/discord/callback`;
console.log('OAuth configured with callback URL:', CALLBACK_URL);

passport.use('discord', new OAuth2Strategy({
  authorizationURL: 'https://discord.com/oauth2/authorize',
  tokenURL: 'https://discord.com/api/oauth2/token',
  clientID: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  callbackURL: CALLBACK_URL,
  scope: ['identify']
}, async (accessToken, refreshToken, params, profile, done) => {
  // Fetch user info from Discord
  try {
    console.log('OAuth callback received, fetching user info...');
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const user = await response.json();
    console.log('Discord user:', user.id, user.username);
    return done(null, user);
  } catch (err) {
    console.error('OAuth error:', err);
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Routes

// Discord OAuth2 login
app.get('/auth/discord', passport.authenticate('discord'));

// Discord OAuth2 callback
app.get('/auth/discord/callback', 
  passport.authenticate('discord', { failureRedirect: '/?auth_error=cancelled' }),
  async (req, res) => {
    console.log('OAuth callback - user:', req.user?.id, req.user?.username);
    const discordId = req.user?.id;
    
    if (!discordId) {
      console.log('No user ID in session');
      req.logout(() => res.redirect('/?auth_error=server_error'));
      return;
    }
    
    const whitelisted = await isWhitelisted(discordId);
    if (!whitelisted) {
      console.log('User not whitelisted:', discordId);
      // Destroy session and redirect with error
      req.logout(() => res.redirect('/?auth_error=no_key'));
      return;
    }
    
    console.log('User whitelisted, redirecting to dashboard');
    res.redirect('/');
  }
);

// Logout
app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// API: Get current user
app.get('/api/auth/me', async (req, res) => {
  console.log('Auth check - isAuthenticated:', req.isAuthenticated(), 'user:', req.user?.id);
  if (!req.isAuthenticated()) {
    return res.json({ success: false });
  }
  
  const discordId = req.user.id;
  console.log('Auth success for:', discordId);
  
  res.json({
    success: true,
    discord_id: discordId,
    username: req.user.username,
    global_name: req.user.global_name || req.user.username,
    avatar: req.user.avatar,
    is_admin: await isAdmin(discordId)
  });
});

// API: Get whitelist (admin only)
app.get('/api/admin/whitelist', async (req, res) => {
  if (!req.isAuthenticated() || !(await isAdmin(req.user.id))) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const whitelist = await getWhitelist();
  res.json({ success: true, whitelist });
});

// API: Add user to whitelist (admin only)
app.post('/api/admin/whitelist/add', async (req, res) => {
  if (!req.isAuthenticated() || !(await isAdmin(req.user.id))) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const { discord_id, username } = req.body;
  console.log('Adding to whitelist:', discord_id, username, 'using MySQL:', useMySQL);
  if (!discord_id) {
    return res.status(400).json({ success: false, error: 'Discord ID required' });
  }
  
  const alreadyWhitelisted = await isWhitelisted(discord_id);
  if (alreadyWhitelisted) {
    return res.json({ success: false, error: 'User already whitelisted' });
  }
  
  const success = await addToWhitelist(discord_id, username || null, req.user.id);
  console.log('Add to whitelist result:', success);
  
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Failed to add user' });
  }
});

// API: Remove user from whitelist (admin only)
app.post('/api/admin/whitelist/remove', async (req, res) => {
  if (!req.isAuthenticated() || !(await isAdmin(req.user.id))) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const { discord_id } = req.body;
  console.log('Removing from whitelist:', discord_id, 'using MySQL:', useMySQL);
  if (!discord_id) {
    return res.status(400).json({ success: false, error: 'Discord ID required' });
  }
  
  const adminCheck = await isAdmin(discord_id);
  if (adminCheck) {
    return res.status(400).json({ success: false, error: 'Cannot remove admin' });
  }
  
  const success = await removeFromWhitelist(discord_id);
  console.log('Remove from whitelist result:', success);
  
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Failed to remove user' });
  }
});

// API: Save tab
app.post('/api/tabs/save', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const { name, code } = req.body;
  const discordId = req.user.id;
  console.log('Saving tab:', name, 'for user:', discordId, 'using MySQL:', useMySQL);
  console.log('Code length:', code ? code.length : 0);
  console.log('Code preview:', code ? code.substring(0, 100) : 'no code');
  
  if (!name || !code) {
    return res.status(400).json({ success: false, error: 'Name and code required' });
  }
  
  if (useMySQL) {
    try {
      await db.execute(
        'INSERT INTO user_configs (discord_id, tab_name, code) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE code = ?, updated_at = CURRENT_TIMESTAMP',
        [discordId, name, code, code]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Error saving tab:', err);
      res.status(500).json({ success: false, error: 'Failed to save tab' });
    }
  } else {
    // Fallback to memory (not persistent)
    res.json({ success: true });
  }
});

// API: Delete tab
app.post('/api/tabs/delete', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const { name } = req.body;
  const discordId = req.user.id;
  console.log('Deleting tab:', name, 'for user:', discordId);
  
  if (!name) {
    return res.status(400).json({ success: false, error: 'Name required' });
  }
  
  if (useMySQL) {
    try {
      await db.execute(
        'DELETE FROM user_configs WHERE discord_id = ? AND tab_name = ?',
        [discordId, name]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting tab:', err);
      res.status(500).json({ success: false, error: 'Failed to delete tab' });
    }
  } else {
    res.json({ success: true });
  }
});

// API: Set active tab
app.post('/api/tabs/set', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const { name } = req.body;
  console.log('Setting active tab:', name);
  
  res.json({ success: true });
});

// API: Verify Turnstile token
app.post('/api/turnstile/verify', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ success: false, error: 'Token required' });
  }
  
  if (!TURNSTILE_SECRET_KEY) {
    // If no secret key configured, skip verification (for development)
    return res.json({ success: true });
  }
  
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(TURNSTILE_SECRET_KEY)}&response=${encodeURIComponent(token)}`,
    });
    
    const result = await response.json();
    
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: 'Verification failed' });
    }
  } catch (err) {
    console.error('Turnstile verification error:', err);
    res.status(500).json({ success: false, error: 'Verification error' });
  }
});

// API: Get tabs
app.get('/api/tabs', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const discordId = req.user.id;
  console.log('Loading tabs for user:', discordId, 'using MySQL:', useMySQL);
  
  if (useMySQL) {
    try {
      const [rows] = await db.execute(
        'SELECT tab_name, code FROM user_configs WHERE discord_id = ? ORDER BY updated_at DESC',
        [discordId]
      );
      console.log('Tabs loaded from database:', rows.length, 'tabs');
      rows.forEach(row => {
        console.log('Tab:', row.tab_name, 'Code length:', row.code ? row.code.length : 0);
      });
      const tabs = rows.map(row => ({ name: row.tab_name, code: row.code }));
      res.json({ success: true, tabs });
    } catch (err) {
      console.error('Error loading tabs:', err);
      res.status(500).json({ success: false, error: 'Failed to load tabs' });
    }
  } else {
    res.json({ success: true, tabs: [] });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server after DB connection
async function startServer() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Admins are stored in database (MySQL) or JSON file');
    console.log('Make sure to set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables');
  });
}

startServer();
