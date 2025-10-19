# XYIAN Discord Bot Monorepo

A Discord bot for the XYIAN Archero 2 community with clean RAG-based knowledge system.

## Project Structure

This is a monorepo with the main bot code in the `xyian-bot-project/` directory:

```
discord-bot/ (root)
├── package.json (workspace manager)
├── railway.json (points to xyian-bot-project/)
├── Dockerfile (optional Docker deployment)
├── Procfile (Railway process config)
├── README.md (this file)
├── LICENSE
├── .gitignore
├── ORGANIZATION-RULES.md
├── discord-scripts/ (utility scripts)
├── archive/ (old code, guides)
└── xyian-bot-project/ (MAIN BOT - single source of truth)
    ├── ultimate-xyian-bot.js (main bot file)
    ├── working-rag-system.js (RAG system)
    ├── training-system.js (training system)
    ├── package.json (bot dependencies)
    ├── railway.json (bot deployment config)
    ├── README.md (complete bot docs)
    ├── data/ (game data and knowledge base)
    ├── docs/ (bot-specific documentation)
    ├── scripts/ (bot utility scripts)
    ├── research-tools/ (data collection tools)
    └── tests/ (bot tests)
```

## Quick Start

```bash
# Install dependencies
npm install

# Start the bot
npm start
```

The root `npm start` command will automatically navigate to `xyian-bot-project/` and start the bot.

## Railway Deployment

This project is configured for Railway deployment with:
- Node.js 18
- Automatic dependency installation
- Proper start command configuration
- Health check endpoints
- Nixpacks builder

## Features

- Clean RAG-based knowledge system
- Real-time Discord integration
- Duplicate message prevention
- Daily automated messages
- Training system for knowledge updates

## Documentation

For complete bot documentation, see `xyian-bot-project/README.md`.
