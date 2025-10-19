# File Organization Rules - CRITICAL

## 🚨 ROOT DIRECTORY RULES - NEVER VIOLATE

**The root directory is ONLY for Railway deployment configuration files!**

### ✅ ALLOWED IN ROOT:
- `package.json` - Main project configuration
- `railway.json` - Railway deployment config  
- `Procfile` - Process configuration
- `.nvmrc` - Node.js version
- `README.md` - Project documentation
- `.cursorrules` - AI assistant rules
- `.gitignore` - Git ignore rules
- `LICENSE` - Project license

### ❌ NEVER IN ROOT:
- Python scripts (.py files)
- One-off JavaScript files
- Test files
- Documentation files (except README.md)
- Data files
- Temporary files
- Random scripts

## 📁 PROPER FILE LOCATIONS

### Bot Code
- **Main Bot**: `xyian-bot-project/ultimate-xyian-bot.js`
- **RAG System**: `xyian-bot-project/working-rag-system.js`
- **Training System**: `xyian-bot-project/training-system.js`

### Scripts
- **One-off scripts**: `scripts/` (DELETE when done)
- **Bot scripts**: `xyian-bot-project/scripts/`
- **Research tools**: `xyian-bot-project/research-tools/`

### Documentation
- **Project docs**: `xyian-bot-project/docs/` or `docs/`
- **API docs**: `xyian-bot-project/API-DOCS.md`
- **Status reports**: `xyian-bot-project/PROJECT-STATUS.md`

### Data
- **Game data**: `xyian-bot-project/data/real-structured-data/`
- **Training data**: `xyian-bot-project/data/user-training/`
- **Archived data**: `xyian-bot-project/data/outdated-data/`

### Tests
- **Bot tests**: `xyian-bot-project/tests/`
- **Integration tests**: `tests/`

## 🔄 CLEANUP WORKFLOW

### Before Adding Any File:
1. **STOP** - Don't just create files anywhere
2. **ANALYZE** - Where should this file go?
3. **ORGANIZE** - Create proper directory if needed
4. **PLACE** - Put file in correct location
5. **CLEAN** - Delete temporary files when done

### One-off Scripts:
1. Create in `scripts/` directory
2. Use the script
3. **DELETE** when done
4. Never leave temporary files

### Railway Deployment:
- Railway detects project type by root directory files
- Python files in root = Python project (WRONG!)
- Node.js files in root = Node.js project (CORRECT!)
- Keep root clean and organized

## ⚠️ COMMON MISTAKES TO AVOID

1. **Adding Python files to root** - Causes Railway to detect as Python project
2. **Leaving temporary scripts** - Clutters the repository
3. **Creating random .js files** - Should go in proper directories
4. **Not cleaning up** - Always delete temporary files
5. **Ignoring organization** - Every file has a proper place

## 🎯 SUCCESS CRITERIA

- Root directory contains ONLY deployment configuration files
- All code is properly organized in subdirectories
- No temporary files left behind
- Railway deploys correctly as Node.js project
- Easy to find and maintain files

---

**Remember**: Organization is not optional - it's critical for Railway deployment and project maintainability!
