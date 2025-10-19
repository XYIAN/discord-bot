const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class FocusedDiscordScraper {
    constructor() {
        this.baseUrl = 'https://discord.com/developers/docs';
        this.outputDir = path.join(__dirname, '..', 'docs', 'discord-api');
        this.visited = new Set();
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🚀 Launching browser...');
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await this.page.setViewport({ width: 1920, height: 1080 });
    }

    async scrapePage(url, title) {
        if (this.visited.has(url)) return;
        this.visited.add(url);

        try {
            console.log(`📄 Scraping: ${title} - ${url}`);
            
            await this.page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            await this.page.waitForTimeout(3000);

            const content = await this.page.evaluate(() => {
                // Find main content
                const contentSelectors = [
                    'main',
                    '.content',
                    '.markdown',
                    '.documentation',
                    'article',
                    '[data-testid="content"]'
                ];

                let contentElement = document.querySelector('main') || document.body;
                
                // Remove unwanted elements
                const unwanted = contentElement.querySelectorAll('nav, .sidebar, .navigation, .footer, .header, script, style, .advertisement');
                unwanted.forEach(el => el.remove());

                return {
                    title: document.title,
                    content: contentElement.innerHTML,
                    text: contentElement.textContent
                };
            });

            const markdown = this.convertToMarkdown(content.content, title, url);
            
            const filename = this.sanitizeFilename(title) + '.md';
            const filepath = path.join(this.outputDir, filename);
            fs.writeFileSync(filepath, markdown);
            
            console.log(`✅ Saved: ${filename} (${markdown.length} chars)`);

        } catch (error) {
            console.error(`❌ Error scraping ${url}:`, error.message);
        }
    }

    convertToMarkdown(html, title, url) {
        let markdown = `# ${title}\n\n`;
        markdown += `**Source:** ${url}\n\n`;
        markdown += `**Scraped:** ${new Date().toISOString()}\n\n`;
        markdown += '---\n\n';

        // Enhanced HTML to Markdown conversion
        let content = html
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
            .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
            .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
            .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
            .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n')
            .replace(/<ul[^>]*>(.*?)<\/ul>/gi, '$1\n')
            .replace(/<ol[^>]*>(.*?)<\/ol>/gi, '$1\n')
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
            .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
            .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
            .replace(/<table[^>]*>(.*?)<\/table>/gi, '\n$1\n\n')
            .replace(/<tr[^>]*>(.*?)<\/tr>/gi, '| $1 |\n')
            .replace(/<td[^>]*>(.*?)<\/td>/gi, '$1 |')
            .replace(/<th[^>]*>(.*?)<\/th>/gi, '**$1** |')
            .replace(/<[^>]+>/g, '')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .replace(/\|\s*\|\s*\|/g, '|')
            .trim();

        return markdown + content;
    }

    sanitizeFilename(title) {
        return title
            .replace(/[^a-zA-Z0-9\s-_]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase()
            .substring(0, 100);
    }

    async scrapeAll() {
        console.log('🚀 Starting focused Discord API documentation scrape...');
        
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        await this.init();

        // Focus on the most important Discord API documentation
        const importantPages = [
            // Core API
            { url: 'https://discord.com/developers/docs/intro', title: 'Introduction' },
            { url: 'https://discord.com/developers/docs/getting-started', title: 'Getting Started' },
            { url: 'https://discord.com/developers/docs/getting-started/setup', title: 'Setup' },
            { url: 'https://discord.com/developers/docs/getting-started/creating-an-app', title: 'Creating an App' },
            { url: 'https://discord.com/developers/docs/getting-started/creating-a-bot', title: 'Creating a Bot' },
            { url: 'https://discord.com/developers/docs/getting-started/adding-a-bot', title: 'Adding a Bot' },
            { url: 'https://discord.com/developers/docs/getting-started/installing-libraries', title: 'Installing Libraries' },
            { url: 'https://discord.com/developers/docs/getting-started/your-first-bot', title: 'Your First Bot' },
            
            // Gateway (Most Important for Bots)
            { url: 'https://discord.com/developers/docs/topics/gateway', title: 'Gateway' },
            { url: 'https://discord.com/developers/docs/topics/gateway/connecting', title: 'Gateway Connecting' },
            { url: 'https://discord.com/developers/docs/topics/gateway/identifying', title: 'Gateway Identifying' },
            { url: 'https://discord.com/developers/docs/topics/gateway/resuming', title: 'Gateway Resuming' },
            { url: 'https://discord.com/developers/docs/topics/gateway/rate-limiting', title: 'Gateway Rate Limiting' },
            { url: 'https://discord.com/developers/docs/topics/gateway/payloads', title: 'Gateway Payloads' },
            { url: 'https://discord.com/developers/docs/topics/gateway/events', title: 'Gateway Events' },
            { url: 'https://discord.com/developers/docs/topics/gateway/commands', title: 'Gateway Commands' },
            { url: 'https://discord.com/developers/docs/topics/gateway/voice', title: 'Gateway Voice' },
            { url: 'https://discord.com/developers/docs/topics/gateway/websockets', title: 'Gateway WebSockets' },
            
            // OAuth2
            { url: 'https://discord.com/developers/docs/topics/oauth2', title: 'OAuth2' },
            { url: 'https://discord.com/developers/docs/topics/oauth2/oauth2-flow', title: 'OAuth2 Flow' },
            { url: 'https://discord.com/developers/docs/topics/oauth2/oauth2-scopes', title: 'OAuth2 Scopes' },
            
            // Rate Limits
            { url: 'https://discord.com/developers/docs/topics/rate-limits', title: 'Rate Limits' },
            { url: 'https://discord.com/developers/docs/topics/rate-limits/rate-limits', title: 'Rate Limits Details' },
            
            // Permissions
            { url: 'https://discord.com/developers/docs/topics/permissions', title: 'Permissions' },
            { url: 'https://discord.com/developers/docs/topics/permissions/permissions', title: 'Permissions Details' },
            { url: 'https://discord.com/developers/docs/topics/permissions/permissions-bitwise', title: 'Permissions Bitwise' },
            { url: 'https://discord.com/developers/docs/topics/permissions/permissions-list', title: 'Permissions List' },
            { url: 'https://discord.com/developers/docs/topics/permissions/permissions-intents', title: 'Permissions Intents' },
            
            // Key Resources
            { url: 'https://discord.com/developers/docs/resources/application', title: 'Application Resource' },
            { url: 'https://discord.com/developers/docs/resources/channel', title: 'Channel Resource' },
            { url: 'https://discord.com/developers/docs/resources/guild', title: 'Guild Resource' },
            { url: 'https://discord.com/developers/docs/resources/user', title: 'User Resource' },
            { url: 'https://discord.com/developers/docs/resources/webhook', title: 'Webhook Resource' },
            { url: 'https://discord.com/developers/docs/resources/emoji', title: 'Emoji Resource' },
            { url: 'https://discord.com/developers/docs/resources/sticker', title: 'Sticker Resource' },
            { url: 'https://discord.com/developers/docs/resources/invite', title: 'Invite Resource' }
        ];
        
        for (const page of importantPages) {
            await this.scrapePage(page.url, page.title);
            await this.page.waitForTimeout(2000); // 2 second delay
        }

        await this.browser.close();
        console.log('\n✅ Focused Discord API documentation scrape completed!');
        console.log(`📁 Files saved to: ${this.outputDir}`);
    }
}

// Run the scraper
if (require.main === module) {
    const scraper = new FocusedDiscordScraper();
    scraper.scrapeAll().catch(console.error);
}

module.exports = FocusedDiscordScraper;
