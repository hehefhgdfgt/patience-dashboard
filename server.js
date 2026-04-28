const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration - UPDATE THESE WITH YOUR DISCORD BOT CREDENTIALS
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1497815572015218871';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'JnvjqcBpMF7tMqDoQzUxv4Soifu9lDjz';
const SESSION_SECRET = process.env.SESSION_SECRET || 'patience-secret-key-change-in-production';
const ADMIN_IDS = ['903808042355806239', '586722125289619482'];

// MySQL Connection - uses Railway's MYSQL_URL
const MYSQL_URL = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
let db;

// MongoDB Connection
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/coachtopia';
let mongoClient;
let scriptsCollection;

// Initialize MySQL connection (required)
async function initDB() {
  if (!MYSQL_URL) {
    console.error('MYSQL_URL is required. Please set the MYSQL_URL environment variable.');
    process.exit(1);
  }
  
  try {
    db = await mysql.createConnection(MYSQL_URL);
    console.log('MySQL connected successfully');
    
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
    
    // Insert admins if not exists
    for (const adminId of ADMIN_IDS) {
      await db.execute(
        'INSERT IGNORE INTO whitelist (discord_id, username, added_by) VALUES (?, ?, ?)',
        [adminId, 'admin', 'system']
      );
    }
    
    console.log('Database initialized');
  } catch (err) {
    console.error('MySQL connection error:', err.message);
    process.exit(1);
  }
}

// Initialize MongoDB connection
async function initMongoDB() {
  try {
    mongoClient = new MongoClient(MONGODB_URL);
    await mongoClient.connect();
    console.log('MongoDB connected successfully');
    
    const db = mongoClient.db();
    scriptsCollection = db.collection('scripts');
    
    // Create index on name for faster queries
    await scriptsCollection.createIndex({ name: 1 }, { unique: true });
    
    console.log('MongoDB initialized');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Continuing without MongoDB (script features will be disabled)');
  }
}

// Check if user is whitelisted
async function isWhitelisted(discordId) {
  const [rows] = await db.execute('SELECT discord_id FROM whitelist WHERE discord_id = ?', [discordId]);
  return rows.length > 0;
}

// Check if user is admin
function isAdmin(discordId) {
  return ADMIN_IDS.includes(discordId);
}

// Get all whitelisted users
async function getWhitelist() {
  const [rows] = await db.execute('SELECT * FROM whitelist ORDER BY added_at DESC');
  return { admin: ADMIN_IDS[0], users: rows };
}

// Add user to whitelist
async function addToWhitelist(discordId, username, addedBy) {
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
}

// Remove user from whitelist
async function removeFromWhitelist(discordId) {
  if (ADMIN_IDS.includes(discordId)) return false; // Can't remove admin
  
  try {
    await db.execute('DELETE FROM whitelist WHERE discord_id = ?', [discordId]);
    return true;
  } catch (err) {
    console.error('Error removing from whitelist:', err);
    return false;
  }
}

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Security headers to prevent source viewing and copying
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Block view-source in modern browsers
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';");
  // Disable caching to prevent saving pages
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // Prevent browser features that expose source
  res.setHeader('Permissions-Policy', 'view-source=(), document-domain=()');
  next();
});

// Anti-bot / Anti-cloner detection (server-side)
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const lowerUA = userAgent.toLowerCase();
  
  // Block known bot patterns
  const botPatterns = [
    'headless', 'phantomjs', 'selenium', 'webdriver', 'puppeteer',
    'playwright', 'crawler', 'spider', 'scraper', 'httrack',
    'wget', 'curl', 'bot', 'automated', 'website-clone',
    'pixellize', 'httrack', 'webcopy', 'savepage'
  ];
  
  const isBot = botPatterns.some(pattern => lowerUA.includes(pattern));
  
  // Check for automation headers
  const hasWebDriverHeader = req.headers['x-webdriver'] || req.headers['webdriver'];
  
  // Check for suspicious behavior (no accept header, missing common headers)
  const suspiciousHeaders = !req.headers['accept-language'] || !req.headers['accept-encoding'];
  
  // Check for headless Chrome/Firefox indicators
  const isHeadless = userAgent.includes('Headless') || 
                     (!req.headers['sec-ch-ua'] && userAgent.includes('Chrome'));
  
  if (isBot || hasWebDriverHeader || (isHeadless && suspiciousHeaders)) {
    console.log(`[BOT-BLOCK] Blocked request from: ${req.ip}, UA: ${userAgent.substring(0, 100)}`);
    return res.status(403).send('<html><body style="background:#000;margin:0;"></body></html>');
  }
  
  next();
});

// Script loader configuration - this script will be loaded when user clicks "set"
const SCRIPT_LOADER = `loadstring(game:HttpGet("https://pastebin.com/raw/5BVf6JHn"))()`;
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true, // Allow uninitialized sessions
  cookie: {
    secure: false, // Try false first
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: false
  },
  name: 'coachtopia.sid'
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
app.get('/api/auth/me', (req, res) => {
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
    is_admin: isAdmin(discordId)
  });
});

// API: Get whitelist (admin only)
app.get('/api/admin/whitelist', async (req, res) => {
  if (!req.isAuthenticated() || !isAdmin(req.user.id)) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const whitelist = await getWhitelist();
  res.json({ success: true, whitelist });
});

// API: Add user to whitelist (admin only)
app.post('/api/admin/whitelist/add', async (req, res) => {
  if (!req.isAuthenticated() || !isAdmin(req.user.id)) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const { discord_id, username } = req.body;
  console.log('Adding to whitelist:', discord_id, username);
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
  if (!req.isAuthenticated() || !isAdmin(req.user.id)) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const { discord_id } = req.body;
  console.log('Removing from whitelist:', discord_id);
  if (!discord_id) {
    return res.status(400).json({ success: false, error: 'Discord ID required' });
  }
  
  if (ADMIN_IDS.includes(discord_id)) {
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
  console.log('Saving tab:', name, 'for user:', discordId);
  console.log('Code length:', code ? code.length : 0);
  console.log('Code preview:', code ? code.substring(0, 100) : 'no code');
  
  if (!name || !code) {
    return res.status(400).json({ success: false, error: 'Name and code required' });
  }
  
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

// API: Get tabs
app.get('/api/tabs', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const discordId = req.user.id;
  console.log('Loading tabs for user:', discordId);
  
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
});

// API: Get all scripts (admin only)
app.get('/api/scripts', async (req, res) => {
  if (!req.isAuthenticated() || !isAdmin(req.user.id)) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  if (!scriptsCollection) {
    return res.status(503).json({ success: false, error: 'MongoDB not connected' });
  }
  
  try {
    const commands = await scriptsCollection.find({ type: { $in: ['config_loader', 'script_loader'] } }).sort({ order: 1, createdAt: 1 }).toArray();
    res.json({ success: true, scripts: commands });
  } catch (err) {
    console.error('Error loading scripts:', err);
    res.status(500).json({ success: false, error: 'Failed to load scripts' });
  }
});

// API: Get single script
app.get('/api/scripts/:name', async (req, res) => {
  if (!req.isAuthenticated() || !isAdmin(req.user.id)) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  if (!scriptsCollection) {
    return res.status(503).json({ success: false, error: 'MongoDB not connected' });
  }
  
  try {
    const script = await scriptsCollection.findOne({ name: req.params.name });
    if (!script) {
      return res.status(404).json({ success: false, error: 'Script not found' });
    }
    res.json({ success: true, script });
  } catch (err) {
    console.error('Error loading script:', err);
    res.status(500).json({ success: false, error: 'Failed to load script' });
  }
});

// API: Create script
app.post('/api/scripts', async (req, res) => {
  if (!req.isAuthenticated() || !isAdmin(req.user.id)) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  if (!scriptsCollection) {
    return res.status(503).json({ success: false, error: 'MongoDB not connected' });
  }
  
  const { name, code, description } = req.body;
  
  if (!name || !code) {
    return res.status(400).json({ success: false, error: 'Name and code required' });
  }
  
  try {
    const script = {
      name,
      code,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user.id
    };
    
    await scriptsCollection.insertOne(script);
    res.json({ success: true, script });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Script name already exists' });
    }
    console.error('Error creating script:', err);
    res.status(500).json({ success: false, error: 'Failed to create script' });
  }
});

// API: Update script
app.put('/api/scripts/:name', async (req, res) => {
  if (!req.isAuthenticated() || !isAdmin(req.user.id)) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  if (!scriptsCollection) {
    return res.status(503).json({ success: false, error: 'MongoDB not connected' });
  }
  
  const { code, description } = req.body;
  
  if (!code) {
    return res.status(400).json({ success: false, error: 'Code required' });
  }
  
  try {
    const result = await scriptsCollection.updateOne(
      { name: req.params.name },
      { 
        $set: { 
          code, 
          description: description || '',
          updatedAt: new Date(),
          updatedBy: req.user.id
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Script not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating script:', err);
    res.status(500).json({ success: false, error: 'Failed to update script' });
  }
});

// API: Delete script
app.delete('/api/scripts/:name', async (req, res) => {
  if (!req.isAuthenticated() || !isAdmin(req.user.id)) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  if (!scriptsCollection) {
    return res.status(503).json({ success: false, error: 'MongoDB not connected' });
  }
  
  try {
    const result = await scriptsCollection.deleteOne({ name: req.params.name });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Script not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting script:', err);
    res.status(500).json({ success: false, error: 'Failed to delete script' });
  }
});

// API: Execute script
app.post('/api/scripts/:name/execute', async (req, res) => {
  if (!req.isAuthenticated() || !isAdmin(req.user.id)) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  if (!scriptsCollection) {
    return res.status(503).json({ success: false, error: 'MongoDB not connected' });
  }
  
  try {
    const script = await scriptsCollection.findOne({ name: req.params.name });
    if (!script) {
      return res.status(404).json({ success: false, error: 'Script not found' });
    }
    
    // Execute the script using eval (WARNING: This is dangerous in production)
    // In production, use a sandboxed environment like vm2 or a separate worker process
    let result;
    try {
      result = eval(script.code);
      res.json({ success: true, result, output: String(result) });
    } catch (execErr) {
      res.json({ success: false, error: execErr.message, output: null });
    }
  } catch (err) {
    console.error('Error executing script:', err);
    res.status(500).json({ success: false, error: 'Failed to execute script' });
  }
});

// API: Create execution command in MongoDB (for Roblox polling)
// Trigger rebuild
app.post('/api/execute', async (req, res) => {
  console.log('[EXECUTE] Request received');
  
  if (!req.isAuthenticated()) {
    console.log('[EXECUTE] ERROR: Not authenticated');
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const { code } = req.body;
  console.log(`[EXECUTE] Code length: ${code ? code.length : 0}`);
  
  if (!code) {
    return res.status(400).json({ success: false, error: 'Code required' });
  }
  
  // Get the user's IP
  const userIP = getClientIP(req);
  console.log(`[EXECUTE] User: ${req.user.id}, IP: ${userIP}`);
  
  if (!scriptsCollection) {
    console.log('[EXECUTE] ERROR: MongoDB not connected - SET MONGODB_URL in Railway!');
    return res.status(503).json({ 
      success: false, 
      error: 'MongoDB not connected. Please set MONGODB_URL environment variable in Railway.' 
    });
  }
  
  try {
    // First, delete any old commands for this user/IP to ensure clean state
    await scriptsCollection.deleteMany({
      type: 'execution_command',
      userId: req.user.id,
      ip: userIP
    });
    console.log(`[EXECUTE] Cleared old commands for user ${req.user.id}`);
    
    const timestamp = Date.now();
    
    // Create command for user's config code (sets up shared.coach)
    const configCommandName = `config_${req.user.id}_${timestamp}`;
    const configDoc = {
      name: configCommandName,
      type: 'execution_command',
      code: code,
      userId: req.user.id,
      ip: userIP,
      executed: false,
      createdAt: new Date(),
      order: 1
    };
    
    // Create command for script loader (runs after config)
    const loaderCommandName = `loader_${req.user.id}_${timestamp}`;
    const loaderDoc = {
      name: loaderCommandName,
      type: 'execution_command',
      code: SCRIPT_LOADER,
      userId: req.user.id,
      ip: userIP,
      executed: false,
      createdAt: new Date(Date.now() + 100), // Slightly later
      order: 2
    };
    
    console.log(`[EXECUTE] Inserting config + loader commands to MongoDB`);
    
    await scriptsCollection.insertMany([configDoc, loaderDoc]);
    
    console.log(`[EXECUTE] SUCCESS: Created commands ${configCommandName} and ${loaderCommandName}`);
    res.json({ success: true, message: 'Config and loader commands created', configCommandName, loaderCommandName, ip: userIP });
  } catch (err) {
    console.error('[EXECUTE] ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to create command', details: err.message });
  }
});

// API: Get pending execution commands (for Roblox poller)
app.get('/api/commands/pending', async (req, res) => {
  // Add CORS headers for Roblox
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Get client IP
  const clientIP = getClientIP(req);
  console.log(`[POLL] Request from IP: ${clientIP}`);
  console.log(`[POLL] Headers:`, JSON.stringify(req.headers, null, 2));
  
  if (!scriptsCollection) {
    console.log('[POLL] ERROR: MongoDB not connected');
    return res.status(503).json({ success: false, error: 'MongoDB not connected' });
  }
  
  try {
    // Find commands for this IP that haven't been executed
    const query = {
      type: 'execution_command',
      ip: clientIP,
      executed: false
    };
    console.log(`[POLL] Query:`, JSON.stringify(query));
    
    const commands = await scriptsCollection.find(query).toArray();
    console.log(`[POLL] Found ${commands.length} command(s) for IP ${clientIP}`);
    
    // Debug: show all pending commands in DB
    const allPending = await scriptsCollection.find({ type: 'execution_command', executed: false }).toArray();
    console.log(`[POLL] Total pending commands in DB: ${allPending.length}`);
    allPending.forEach(cmd => {
      console.log(`[POLL]   - ${cmd.name} (IP: ${cmd.ip})`);
    });
    
    // Delete commands immediately after fetching them
    if (commands.length > 0) {
      const commandNames = commands.map(cmd => cmd.name);
      await scriptsCollection.deleteMany({ name: { $in: commandNames } });
      console.log(`[POLL] Deleted ${commands.length} command(s) after sending`);
    }
    
    res.json({
      success: true,
      commands: commands.map(cmd => ({
        name: cmd.name,
        code: cmd.code,
        createdAt: cmd.createdAt
      }))
    });
  } catch (err) {
    console.error('[POLL] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch commands' });
  }
});

// API: Get client IP for debugging
app.get('/api/myip', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  const clientIP = getClientIP(req);
  console.log(`[MYIP] IP check from: ${clientIP}`);
  res.json({ success: true, ip: clientIP });
});

// API: Mark command as executed (Roblox calls this after execution)
app.post('/api/commands/:name/executed', async (req, res) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const clientIP = getClientIP(req);
  console.log(`[EXECUTED] Marking ${req.params.name} as executed from IP: ${clientIP}`);
  
  if (!scriptsCollection) {
    return res.status(503).json({ success: false, error: 'MongoDB not connected' });
  }
  
  try {
    // Delete the command after execution
    await scriptsCollection.deleteOne({ name: req.params.name });
    console.log(`[EXECUTED] Deleted command ${req.params.name}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[EXECUTED] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete command' });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// WebSocket server for Roblox clients
let wss;
const connectedClients = new Map(); // ip -> ws

function getClientIP(req) {
  // Get real IP from various headers (Railway/Cloudflare/proxy)
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
}

function initWebSocketServer(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    const clientIP = getClientIP(req);
    console.log(`New WebSocket connection from IP: ${clientIP}`);
    
    // Store connection by IP
    connectedClients.set(clientIP, ws);
    console.log(`Roblox client connected from IP: ${clientIP}`);
    ws.send(JSON.stringify({ type: 'auth_success', ip: clientIP }));
    
    ws.on('close', () => {
      // Remove disconnected client by IP
      for (const [ip, client] of connectedClients.entries()) {
        if (client === ws) {
          connectedClients.delete(ip);
          console.log(`Roblox client disconnected: ${ip}`);
          break;
        }
      }
    });
    
    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });
  
  console.log('WebSocket server initialized on /ws');
}

// Function to broadcast code to a specific IP
function broadcastToIP(ip, code) {
  const ws = connectedClients.get(ip);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'execute', code }));
    return true;
  }
  return false;
}

// Start server after DB connection
async function startServer() {
  await initDB();
  await initMongoDB();
  
  const server = http.createServer(app);
  initWebSocketServer(server);
  
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}/ws`);
    console.log(`Admin IDs: ${ADMIN_IDS.join(', ')}`);
    console.log('Make sure to set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables');
  });
}

startServer();
