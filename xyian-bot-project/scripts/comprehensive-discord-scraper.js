const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ComprehensiveDiscordScraper {
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
        
        // Set user agent
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Set viewport
        await this.page.setViewport({ width: 1920, height: 1080 });
    }

    async scrapePage(url, title) {
        if (this.visited.has(url)) return [];
        this.visited.add(url);

        try {
            console.log(`📄 Scraping: ${title} - ${url}`);
            
            await this.page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Wait for content to load
            await this.page.waitForTimeout(2000);

            // Extract the main content
            const content = await this.page.evaluate(() => {
                // Try to find the main content area
                const contentSelectors = [
                    '.content',
                    '.markdown',
                    'main',
                    '.documentation',
                    'article',
                    '[data-testid="content"]',
                    '.docs-content'
                ];

                let contentElement = null;
                for (const selector of contentSelectors) {
                    contentElement = document.querySelector(selector);
                    if (contentElement) break;
                }

                if (!contentElement) {
                    contentElement = document.body;
                }

                // Remove unwanted elements
                const unwantedSelectors = [
                    '.sidebar',
                    '.navigation',
                    '.footer',
                    '.header',
                    '.breadcrumb',
                    'nav',
                    '.nav',
                    'script',
                    'style',
                    '.advertisement',
                    '.ads'
                ];

                unwantedSelectors.forEach(selector => {
                    const elements = contentElement.querySelectorAll(selector);
                    elements.forEach(el => el.remove());
                });

                return {
                    title: document.title,
                    content: contentElement.innerHTML,
                    links: Array.from(document.querySelectorAll('a[href]'))
                        .map(a => ({
                            href: a.href,
                            text: a.textContent.trim()
                        }))
                        .filter(link => 
                            link.href.includes('/developers/docs/') && 
                            link.text && 
                            !link.href.includes('#') &&
                            !link.href.includes('javascript:')
                        )
                };
            });

            // Convert to markdown
            const markdown = this.convertToMarkdown(content.content, title, url);
            
            // Save the file
            const filename = this.sanitizeFilename(title) + '.md';
            const filepath = path.join(this.outputDir, filename);
            fs.writeFileSync(filepath, markdown);
            
            console.log(`✅ Saved: ${filename}`);

            // Return discovered links
            return content.links.map(link => ({
                url: link.href,
                title: link.text
            }));

        } catch (error) {
            console.error(`❌ Error scraping ${url}:`, error.message);
            return [];
        }
    }

    convertToMarkdown(html, title, url) {
        let markdown = `# ${title}\n\n`;
        markdown += `**Source:** ${url}\n\n`;
        markdown += `**Scraped:** ${new Date().toISOString()}\n\n`;
        markdown += '---\n\n';

        // Basic HTML to Markdown conversion
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
            .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple newlines
            .replace(/\|\s*\|\s*\|/g, '|') // Clean up table formatting
            .trim();

        return markdown + content;
    }

    sanitizeFilename(title) {
        return title
            .replace(/[^a-zA-Z0-9\s-_]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase()
            .substring(0, 100); // Limit filename length
    }

    async scrapeAll() {
        console.log('🚀 Starting comprehensive Discord API documentation scrape...');
        
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        await this.init();

        // Comprehensive list of Discord API documentation pages
        const mainPages = [
            // Getting Started
            { url: 'https://discord.com/developers/docs/intro', title: 'Introduction' },
            { url: 'https://discord.com/developers/docs/getting-started', title: 'Getting Started' },
            { url: 'https://discord.com/developers/docs/getting-started/setup', title: 'Setup' },
            { url: 'https://discord.com/developers/docs/getting-started/creating-an-app', title: 'Creating an App' },
            { url: 'https://discord.com/developers/docs/getting-started/creating-a-bot', title: 'Creating a Bot' },
            { url: 'https://discord.com/developers/docs/getting-started/adding-a-bot', title: 'Adding a Bot' },
            { url: 'https://discord.com/developers/docs/getting-started/installing-libraries', title: 'Installing Libraries' },
            { url: 'https://discord.com/developers/docs/getting-started/your-first-bot', title: 'Your First Bot' },
            
            // OAuth2
            { url: 'https://discord.com/developers/docs/topics/oauth2', title: 'OAuth2' },
            { url: 'https://discord.com/developers/docs/topics/oauth2/oauth2-flow', title: 'OAuth2 Flow' },
            { url: 'https://discord.com/developers/docs/topics/oauth2/oauth2-scopes', title: 'OAuth2 Scopes' },
            { url: 'https://discord.com/developers/docs/topics/oauth2/oauth2-urls', title: 'OAuth2 URLs' },
            { url: 'https://discord.com/developers/docs/topics/oauth2/oauth2-redirects', title: 'OAuth2 Redirects' },
            
            // Gateway
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
            
            // RPC
            { url: 'https://discord.com/developers/docs/topics/rpc', title: 'RPC' },
            { url: 'https://discord.com/developers/docs/topics/rpc/connecting', title: 'RPC Connecting' },
            { url: 'https://discord.com/developers/docs/topics/rpc/events', title: 'RPC Events' },
            { url: 'https://discord.com/developers/docs/topics/rpc/commands', title: 'RPC Commands' },
            { url: 'https://discord.com/developers/docs/topics/rpc/errors', title: 'RPC Errors' },
            
            // Voice Connections
            { url: 'https://discord.com/developers/docs/topics/voice-connections', title: 'Voice Connections' },
            { url: 'https://discord.com/developers/docs/topics/voice-connections/connecting', title: 'Voice Connecting' },
            { url: 'https://discord.com/developers/docs/topics/voice-connections/voice-protocol', title: 'Voice Protocol' },
            { url: 'https://discord.com/developers/docs/topics/voice-connections/encryption', title: 'Voice Encryption' },
            { url: 'https://discord.com/developers/docs/topics/voice-connections/voice-udp', title: 'Voice UDP' },
            
            // Rate Limits
            { url: 'https://discord.com/developers/docs/topics/rate-limits', title: 'Rate Limits' },
            { url: 'https://discord.com/developers/docs/topics/rate-limits/rate-limits', title: 'Rate Limits Details' },
            { url: 'https://discord.com/developers/docs/topics/rate-limits/global-rate-limits', title: 'Global Rate Limits' },
            { url: 'https://discord.com/developers/docs/topics/rate-limits/rate-limits-example', title: 'Rate Limits Example' },
            
            // Opcodes and Status Codes
            { url: 'https://discord.com/developers/docs/topics/opcodes-and-status-codes', title: 'Opcodes and Status Codes' },
            { url: 'https://discord.com/developers/docs/topics/opcodes-and-status-codes/gateway-gateway-opcodes', title: 'Gateway Opcodes' },
            { url: 'https://discord.com/developers/docs/topics/opcodes-and-status-codes/gateway-gateway-close-event-codes', title: 'Gateway Close Event Codes' },
            { url: 'https://discord.com/developers/docs/topics/opcodes-and-status-codes/voice-voice-opcodes', title: 'Voice Opcodes' },
            { url: 'https://discord.com/developers/docs/topics/opcodes-and-status-codes/voice-voice-close-event-codes', title: 'Voice Close Event Codes' },
            { url: 'https://discord.com/developers/docs/topics/opcodes-and-status-codes/http-http-response-codes', title: 'HTTP Response Codes' },
            { url: 'https://discord.com/developers/docs/topics/opcodes-and-status-codes/rpc-rpc-error-codes', title: 'RPC Error Codes' },
            
            // Permissions
            { url: 'https://discord.com/developers/docs/topics/permissions', title: 'Permissions' },
            { url: 'https://discord.com/developers/docs/topics/permissions/permissions', title: 'Permissions Details' },
            { url: 'https://discord.com/developers/docs/topics/permissions/permissions-bitwise', title: 'Permissions Bitwise' },
            { url: 'https://discord.com/developers/docs/topics/permissions/permissions-list', title: 'Permissions List' },
            { url: 'https://discord.com/developers/docs/topics/permissions/permissions-intents', title: 'Permissions Intents' },
            
            // Teams
            { url: 'https://discord.com/developers/docs/topics/teams', title: 'Teams' },
            { url: 'https://discord.com/developers/docs/topics/teams/teams', title: 'Teams Details' },
            { url: 'https://discord.com/developers/docs/topics/teams/teams-members', title: 'Teams Members' },
            { url: 'https://discord.com/developers/docs/topics/teams/teams-applications', title: 'Teams Applications' },
            
            // Resources
            { url: 'https://discord.com/developers/docs/resources/application', title: 'Application Resource' },
            { url: 'https://discord.com/developers/docs/resources/audit-log', title: 'Audit Log Resource' },
            { url: 'https://discord.com/developers/docs/resources/auto-moderation', title: 'Auto Moderation Resource' },
            { url: 'https://discord.com/developers/docs/resources/channel', title: 'Channel Resource' },
            { url: 'https://discord.com/developers/docs/resources/emoji', title: 'Emoji Resource' },
            { url: 'https://discord.com/developers/docs/resources/guild', title: 'Guild Resource' },
            { url: 'https://discord.com/developers/docs/resources/guild-scheduled-event', title: 'Guild Scheduled Event Resource' },
            { url: 'https://discord.com/developers/docs/resources/guild-template', title: 'Guild Template Resource' },
            { url: 'https://discord.com/developers/docs/resources/invite', title: 'Invite Resource' },
            { url: 'https://discord.com/developers/docs/resources/stage-instance', title: 'Stage Instance Resource' },
            { url: 'https://discord.com/developers/docs/resources/sticker', title: 'Sticker Resource' },
            { url: 'https://discord.com/developers/docs/resources/user', title: 'User Resource' },
            { url: 'https://discord.com/developers/docs/resources/voice', title: 'Voice Resource' },
            { url: 'https://discord.com/developers/docs/resources/webhook', title: 'Webhook Resource' }
        ];

        const allLinks = [];
        
        for (const page of mainPages) {
            const links = await this.scrapePage(page.url, page.title);
            if (links && Array.isArray(links)) {
                allLinks.push(...links);
            }
            await this.page.waitForTimeout(1000); // 1 second delay
        }

        // Scrape discovered links (limit to avoid overwhelming)
        console.log(`\n🔍 Found ${allLinks.length} additional pages to scrape...`);
        
        const uniqueLinks = allLinks.filter((link, index, self) => 
            index === self.findIndex(l => l.url === link.url)
        );

        for (const link of uniqueLinks.slice(0, 100)) { // Limit to first 100
            await this.scrapePage(link.url, link.title);
            await this.page.waitForTimeout(1000);
        }

        await this.browser.close();
        console.log('\n✅ Comprehensive Discord API documentation scrape completed!');
        console.log(`📁 Files saved to: ${this.outputDir}`);
    }
}

// Run the scraper
if (require.main === module) {
    const scraper = new ComprehensiveDiscordScraper();
    scraper.scrapeAll().catch(console.error);
}

module.exports = ComprehensiveDiscordScraper;
