# XYIAN Discord Bot - Development Rules & Guidelines

## 🚨 CRITICAL DEVELOPMENT RULES

### 1. VERSION MANAGEMENT (MANDATORY)
- **EVERY COMMIT** must update version in `package.json`
- **EVERY COMMIT** must update `CHANGELOG.md`
- Use semantic versioning: patch (1.2.4 → 1.2.5), minor (1.2.4 → 1.3.0), major (1.2.4 → 2.0.0)
- **NEVER** commit without version update

### 2. CHANNEL RESPONSE LOGIC (CRITICAL)
- **ONLY AI CHANNELS** get live responses: `bot-questions`, `bot-questions-advanced`, `archero-ai`
- **GENERAL CHAT**: Only `!help` and `!menu` - direct to AI channels
- **GUILD RECRUIT**: Completely ignored - cron jobs only
- **ALL OTHERS**: Commands only

### 3. MESSAGE HANDLER STRUCTURE
```javascript
// GATE FIRST - Check channel type before processing
const isCommand = message.content.startsWith('!') || message.content.startsWith('/');
const isDM = message.channel.type === 1;
const isAIChannel = ['bot-questions', 'bot-questions-advanced', 'archero-ai'].includes(message.channel.name);

// IGNORE LISTS
const ignoreChannels = ['guild-recruit-chat', 'xyian-guild', 'guild-chat', 'recruit', 'guild-recruit'];
if (ignoreChannels.includes(message.channel.name)) {
    return; // IGNORE
}

// SAFETY CHECKS
if (!isCommand && !isDM && !isAIChannel) {
    return; // IGNORE
}
```

### 4. COMMIT WORKFLOW (MANDATORY)
1. Make changes
2. Test: `node -c ultimate-xyian-bot.js`
3. Update version in `package.json`
4. Update `CHANGELOG.md`
5. Commit: `git add . && git commit -m "VERSION X.X.X: Description"`
6. Push: `git push`

### 5. TESTING REQUIREMENTS
- **ALWAYS** run syntax check before committing
- **ALWAYS** test locally if possible
- **NEVER** push broken code
- **ALWAYS** verify channel behavior

## 📋 CHANNEL BEHAVIOR MATRIX

| Channel Type | Live Responses | Commands | AI Q&A | Notes |
|-------------|----------------|----------|---------|-------|
| **AI Channels** | ✅ Yes | ✅ Yes | ✅ Yes | bot-questions, archero-ai |
| **General Chat** | ❌ No | ✅ !help, !menu only | ❌ No | Direct to AI channels |
| **Guild Recruit** | ❌ No | ❌ No | ❌ No | Cron jobs only |
| **DMs** | ✅ Yes | ✅ Yes | ✅ Yes | Full functionality |
| **All Others** | ❌ No | ✅ Yes | ❌ No | Commands only |

## 🚨 CRITICAL SAFETY CHECKS

### Message Handler Gate
```javascript
// CRITICAL GATE: ONLY AI CHANNELS GET LIVE RESPONSES
const isCommand = message.content.startsWith('!') || message.content.startsWith('/');
const isDM = message.channel.type === 1;
const isAIChannel = ['bot-questions', 'bot-questions-advanced', 'archero-ai'].includes(message.channel.name);

// IGNORE these channels completely
const ignoreChannels = ['guild-recruit-chat', 'xyian-guild', 'guild-chat', 'recruit', 'guild-recruit'];
if (ignoreChannels.includes(message.channel.name)) {
    console.log(`⏭️ IGNORING: Channel ${message.channel.name} is in ignore list`);
    return;
}

// GENERAL CHAT - Only respond to !help and !menu
const generalChatChannels = ['general', 'general-chat', 'main-chat'];
if (generalChatChannels.includes(message.channel.name)) {
    if (message.content.startsWith('!help') || message.content.startsWith('!menu')) {
        // Allow these commands
    } else {
        console.log(`⏭️ IGNORING: General chat - only !help and !menu allowed`);
        return;
    }
}

// FINAL SAFETY CHECK
if (!isCommand && !isDM && !isAIChannel) {
    console.log(`⏭️ IGNORING: Not a command, not DM, not AI channel`);
    return;
}
```

## 🔧 DEVELOPMENT CHECKLIST

### Before Every Commit:
- [ ] Syntax check: `node -c ultimate-xyian-bot.js`
- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with changes
- [ ] Test channel behavior
- [ ] Verify no duplicate responses
- [ ] Check ignore lists are working

### Commit Message Format:
```
VERSION X.X.X: Brief description of changes

### Fixed
- What was broken and how it was fixed

### Added  
- New features or functionality

### Enhanced
- Improvements to existing features
```

## 🚨 NEVER DO THESE
- ❌ Respond to casual conversation in non-AI channels
- ❌ Ignore version updates
- ❌ Commit without testing
- ❌ Break channel response logic
- ❌ Create duplicate responses
- ❌ Forget to update changelog
- ❌ Push broken code

## ✅ ALWAYS DO THESE
- ✅ Update version and changelog with every commit
- ✅ Test syntax before pushing
- ✅ Use proper commit message format
- ✅ Respect channel-specific behavior
- ✅ Add safety checks for critical features
- ✅ Log ignored channels clearly
- ✅ Follow the gate-first approach

## 📝 CHANGELOG TEMPLATE
```markdown
## [X.X.X] - YYYY-MM-DD

### Fixed
- **CRITICAL: Issue Name**: Description of what was broken and how it was fixed
- **Channel Response Logic**: Specific channel behavior fixes
- **Duplicate Prevention**: How duplicate responses were prevented

### Added
- **Feature Name**: Description of new functionality
- **Safety Checks**: New validation or safety measures
- **Channel Management**: New channel-specific features

### Enhanced
- **System Name**: Improvements to existing functionality
- **User Experience**: Better user interaction
- **Error Prevention**: Better error handling
```

## 🎯 SUCCESS CRITERIA
- ✅ No responses to casual conversation in non-AI channels
- ✅ Only AI channels get live responses without commands
- ✅ Version and changelog updated with every commit
- ✅ All syntax checks pass before pushing
- ✅ Clear logging for all ignored channels
- ✅ No duplicate responses anywhere
- ✅ Proper separation of concerns in message handler
