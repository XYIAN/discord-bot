# Discord Scripts Organization

This folder contains all Discord-related scripts organized by functionality.

## 📁 Folder Structure

### `forum-management/`
Scripts for creating, updating, and managing Discord forum threads.

**Files:**
- `create-*.js` - Scripts to create new forum threads
- `update-*.js` - Scripts to update existing forum threads
- `fix-*.js` - Scripts to fix specific thread content

**Usage:**
```bash
cd discord-scripts/forum-management
node create-character-tier-list.js
node update-peak-arena-guide.js
```

### `mass-updates/`
Scripts for bulk operations when new data arrives.

**Files:**
- `prepare-mass-update.js` - Base functions for thread management
- `mass-delete-all-threads.js` - Delete all threads for fresh start
- `mass-create-new-threads.js` - Create new threads with updated data
- `mass-update-existing-threads.js` - Update existing threads with new data
- `update-table-of-contents.js` - Update table of contents with new thread IDs

**Usage:**
```bash
cd discord-scripts/mass-updates
node mass-delete-all-threads.js
node mass-create-new-threads.js
node update-table-of-contents.js
```

### `webhook-scripts/`
Scripts that use Discord webhooks for automated posting.

**Files:**
- `test-webhook.js` - Test webhook functionality
- `send-daily-message.js` - Send daily reset messages
- `webhook-*.js` - Other webhook-related scripts

**Usage:**
```bash
cd discord-scripts/webhook-scripts
node test-webhook.js
```

### `utility-scripts/`
Utility scripts for data processing, cleanup, and maintenance.

**Files:**
- `*-cleanup*.js` - Cleanup and maintenance scripts
- `*-rag*.js` - RAG system related scripts
- `*-data*.js` - Data processing scripts
- `test-*.js` - Testing and validation scripts

**Usage:**
```bash
cd discord-scripts/utility-scripts
node cleanup-debug-logs.js
node test-api.js
```

## 🚀 Quick Start

1. **Create a new forum thread:**
   ```bash
   cd discord-scripts/forum-management
   node create-[thread-name].js
   ```

2. **Mass update when new data arrives:**
   ```bash
   cd discord-scripts/mass-updates
   node mass-delete-all-threads.js
   node mass-create-new-threads.js
   node update-table-of-contents.js
   ```

3. **Test webhook functionality:**
   ```bash
   cd discord-scripts/webhook-scripts
   node test-webhook.js
   ```

## 📝 Notes

- All scripts use the same webhook URL and Discord token
- Scripts are designed to be run from their respective directories
- Always test scripts before running mass operations
- Check the main project README for environment setup

## 🔧 Environment Variables

Make sure these are set in your `.env` file:
- `DISCORD_TOKEN` - Bot token for API access
- `WEBHOOK_URL` - Webhook URL for automated posting
- `OPENAI_API_KEY` - For AI-powered responses
