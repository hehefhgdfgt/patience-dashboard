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

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1497815572015218871';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'JnvjqcBpMF7tMqDoQzUxv4Soifu9lDjz';
const SESSION_SECRET = process.env.SESSION_SECRET || 'patience-secret-key-change-in-production';
const ADMIN_IDS = ['903808042355806239', '586722125289619482'];

const MYSQL_URL = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
let db;

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/coachtopia';
let mongoClient;
let scriptsCollection;

async function initDB() {
  if (!MYSQL_URL) {
    console.error('MYSQL_URL is required. Please set the MYSQL_URL environment variable.');
    process.exit(1);
  }
  
  try {
    db = await mysql.createConnection(MYSQL_URL);
    console.log('MySQL connected successfully');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS whitelist (
        discord_id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        added_by VARCHAR(255)
      )
    `);

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

async function initMongoDB() {
  try {
    mongoClient = new MongoClient(MONGODB_URL);
    await mongoClient.connect();
    console.log('MongoDB connected successfully');
    
    const db = mongoClient.db();
    scriptsCollection = db.collection('scripts');

    await scriptsCollection.createIndex({ name: 1 }, { unique: true });
    
    console.log('MongoDB initialized');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Continuing without MongoDB (script features will be disabled)');
  }
}

async function isWhitelisted(discordId) {
  const [rows] = await db.execute('SELECT discord_id FROM whitelist WHERE discord_id = ?', [discordId]);
  return rows.length > 0;
}

function isAdmin(discordId) {
  return ADMIN_IDS.includes(discordId);
}

async function getWhitelist() {
  const [rows] = await db.execute('SELECT * FROM whitelist ORDER BY added_at DESC');
  return { admin: ADMIN_IDS[0], users: rows };
}

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

async function removeFromWhitelist(discordId) {
  if (ADMIN_IDS.includes(discordId)) return false; 
  
  try {
    await db.execute('DELETE FROM whitelist WHERE discord_id = ?', [discordId]);
    return true;
  } catch (err) {
    console.error('Error removing from whitelist:', err);
    return false;
  }
}

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

const SCRIPT_LOADER = `loadstring(game:HttpGet("https://pastebin.com/raw/5BVf6JHn"))()`;
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true, 
  cookie: {
    secure: false, 
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: false
  },
  name: 'coachtopia.sid'
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname)));

const PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN || 'coach.fun';
const CALLBACK_URL = `https://${PUBLIC_DOMAIN}/auth/discord/callback`;
console.log('OAuth configured with callback URL:', CALLBACK_URL);

passport.use('discord', new OAuth2Strategy({
  authorizationURL: 'https://discord.com/api/oauth2/authorize',
  tokenURL: 'https://discord.com/api/oauth2/token',
  clientID: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  callbackURL: CALLBACK_URL,
  scope: ['identify']
}, async (accessToken, refreshToken, params, profile, done) => {
  
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

app.get('/auth/discord', passport.authenticate('discord'));

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
      
      req.logout(() => res.redirect('/?auth_error=no_key'));
      return;
    }
    
    console.log('User whitelisted, redirecting to dashboard');
    res.redirect('/');
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

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

app.get('/api/admin/whitelist', async (req, res) => {
  if (!req.isAuthenticated() || !isAdmin(req.user.id)) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const whitelist = await getWhitelist();
  res.json({ success: true, whitelist });
});

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

app.post('/api/tabs/set', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const { name } = req.body;
  console.log('Setting active tab:', name);
  
  res.json({ success: true });
});

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
    
    await scriptsCollection.deleteMany({
      type: 'execution_command',
      userId: req.user.id,
      ip: userIP
    });
    console.log(`[EXECUTE] Cleared old commands for user ${req.user.id}`);
    
    const timestamp = Date.now();

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

    const loaderCommandName = `loader_${req.user.id}_${timestamp}`;
    const loaderDoc = {
      name: loaderCommandName,
      type: 'execution_command',
      code: SCRIPT_LOADER,
      userId: req.user.id,
      ip: userIP,
      executed: false,
      createdAt: new Date(Date.now() + 100), 
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

app.get('/api/commands/pending', async (req, res) => {
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientIP = getClientIP(req);
  console.log(`[POLL] Request from IP: ${clientIP}`);
  console.log(`[POLL] Headers:`, JSON.stringify(req.headers, null, 2));
  
  if (!scriptsCollection) {
    console.log('[POLL] ERROR: MongoDB not connected');
    return res.status(503).json({ success: false, error: 'MongoDB not connected' });
  }
  
  try {
    
    const query = {
      type: 'execution_command',
      ip: clientIP,
      executed: false
    };
    console.log(`[POLL] Query:`, JSON.stringify(query));
    
    const commands = await scriptsCollection.find(query).toArray();
    console.log(`[POLL] Found ${commands.length} command(s) for IP ${clientIP}`);

    const allPending = await scriptsCollection.find({ type: 'execution_command', executed: false }).toArray();
    console.log(`[POLL] Total pending commands in DB: ${allPending.length}`);
    allPending.forEach(cmd => {
      console.log(`[POLL]   - ${cmd.name} (IP: ${cmd.ip})`);
    });

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

app.get('/api/myip', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  const clientIP = getClientIP(req);
  console.log(`[MYIP] IP check from: ${clientIP}`);
  res.json({ success: true, ip: clientIP });
});

app.post('/api/commands/:name/executed', async (req, res) => {
  
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
    
    await scriptsCollection.deleteOne({ name: req.params.name });
    console.log(`[EXECUTED] Deleted command ${req.params.name}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[EXECUTED] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete command' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

let wss;
const connectedClients = new Map(); 

function getClientIP(req) {
  
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

    connectedClients.set(clientIP, ws);
    console.log(`Roblox client connected from IP: ${clientIP}`);
    ws.send(JSON.stringify({ type: 'auth_success', ip: clientIP }));
    
    ws.on('close', () => {
      
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

function broadcastToIP(ip, code) {
  const ws = connectedClients.get(ip);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'execute', code }));
    return true;
  }
  return false;
}

async function startServer() {
  await initDB();
  await initMongoDB();
  
  const server = http.createServer(app);
  initWebSocketServer(server);
  
  server.listen(PORT, () => {
    console.log(`Server running on http:
    console.log(`WebSocket server running on ws:
    console.log(`Admin IDs: ${ADMIN_IDS.join(', ')}`);
    console.log('Make sure to set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables');
  });
}

startServer();
