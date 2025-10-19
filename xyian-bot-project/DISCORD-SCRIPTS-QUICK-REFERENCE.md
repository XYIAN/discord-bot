# Discord Scripts Quick Reference

All Discord-related scripts have been organized into the `discord-scripts/` folder.

## 🚀 Quick Commands

### Forum Management
```bash
# Create a new thread
cd discord-scripts/forum-management
node create-[thread-name].js

# Update existing thread
node update-[thread-name].js
```

### Mass Updates (When New Data Arrives)
```bash
# Delete all threads and start fresh
cd discord-scripts/mass-updates
node mass-delete-all-threads.js

# Create all new threads
node mass-create-new-threads.js

# Update table of contents
node update-table-of-contents.js
```

### Utility Scripts
```bash
# Cleanup and maintenance
cd discord-scripts/utility-scripts
node cleanup-debug-logs.js
node aggressive-cleanup.js
```

## 📁 Folder Structure

- `discord-scripts/forum-management/` - Individual thread creation/updates
- `discord-scripts/mass-updates/` - Bulk operations for new data
- `discord-scripts/utility-scripts/` - Cleanup, testing, data processing
- `discord-scripts/webhook-scripts/` - Webhook-related scripts

## 📖 Full Documentation

See `discord-scripts/README.md` for complete documentation.

## 🔧 Environment Setup

Make sure your `.env` file has:
- `DISCORD_TOKEN` - Bot token for API access
- `WEBHOOK_URL` - Webhook URL for automated posting
- `OPENAI_API_KEY` - For AI-powered responses
