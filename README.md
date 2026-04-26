# Patience Dashboard - Discord OAuth2 Authentication

A dashboard with Discord OAuth2 authentication and whitelist management system.

## Setup Instructions

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "OAuth2" tab
4. Under "Redirects", add these URLs:
   - **Local development:** `http://localhost:3000/auth/discord/callback`
   - **Railway:** `https://your-app.railway.app/auth/discord/callback` (replace with your Railway URL)
5. Copy the **Client ID** and **Client Secret**

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Environment Variables

Create a `.env` file in the project root for local development:

```env
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
SESSION_SECRET=your_random_secret_here
```

### 4. Start the Server (Local)

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The server will run on `http://localhost:3000`

## Railway Deployment

### 1. Deploy to Railway

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Railway will detect the Node.js app and deploy it

### 2. Add MySQL Database

1. In your Railway project, click "New Service"
2. Select "MySQL" from the database options
3. Railway will create a MySQL instance

### 3. Set Environment Variables

In your Railway project settings, add these environment variables:

```
DISCORD_CLIENT_ID=1497815572015218871
DISCORD_CLIENT_SECRET=JnvjqcBpMF7tMqDoQzUxv4Soifu9lDjz
SESSION_SECRET=patience-dashboard-secret-key-2024
MYSQL_URL={{MySQL.MYSQL_URL}}
```

The `{{MySQL.MYSQL_URL}}` will automatically connect to your Railway MySQL database.

### 4. Update Discord Redirect URL

1. Go back to Discord Developer Portal
2. Update the OAuth2 redirect URL to your Railway domain:
   - `https://your-app-name.railway.app/auth/discord/callback`

### How It Works

- **Local (no MYSQL_URL):** Uses `whitelist.json` file for storage
- **Railway (with MYSQL_URL):** Uses MySQL database for persistent storage

The MySQL database automatically creates a `whitelist` table with:
- `discord_id` (primary key)
- `username`
- `added_at` (timestamp)
- `added_by` (who added the user)

## Whitelist System

The admin ID is set to: `903808042355806239`

This user has full admin privileges and can:
- Add users to the whitelist
- Remove users from the whitelist
- Access the admin panel

### Managing the Whitelist

1. Login with your admin Discord account
2. Click the admin panel icon in the sidebar
3. Use the "whitelist management" section to:
   - Add Discord IDs to the whitelist
   - Remove Discord IDs from the whitelist

Whitelisted users can access the dashboard after Discord OAuth2 authentication.

## API Endpoints

### Authentication
- `GET /auth/discord` - Start Discord OAuth2 login
- `GET /auth/discord/callback` - OAuth2 callback
- `GET /auth/logout` - Logout
- `GET /api/auth/me` - Get current user info

### Whitelist Management (Admin Only)
- `GET /api/admin/whitelist` - Get whitelist
- `POST /api/admin/whitelist/add` - Add user to whitelist
- `POST /api/admin/whitelist/remove` - Remove user from whitelist

## File Structure

- `server.js` - Node.js backend server with MySQL support
- `package.json` - Dependencies and scripts
- `index.html` - Frontend dashboard with IDE-style UI
- `whitelist.json` - Local fallback whitelist storage
- `auth/` - Authentication files

## Security Notes

- Keep your `DISCORD_CLIENT_SECRET` and `SESSION_SECRET` secure
- In production, use HTTPS (Railway provides this automatically)
- Change the `SESSION_SECRET` to a random string
- MySQL is used for persistent storage on Railway
