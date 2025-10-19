const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class DiscordAPIScraper {
    constructor() {
        this.baseUrl = 'https://discord.com/developers/docs';
        this.outputDir = path.join(__dirname, '..', 'docs', 'discord-api');
        this.visited = new Set();
        this.delay = 1000; // 1 second delay between requests
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async scrapePage(url, title) {
        if (this.visited.has(url)) return [];
        this.visited.add(url);

        try {
            console.log(`📄 Scraping: ${title} - ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            
            // Extract main content
            let content = '';
            
            // Try different selectors for content
            const contentSelectors = [
                '.content',
                '.markdown',
                'main',
                '.documentation',
                'article'
            ];

            for (const selector of contentSelectors) {
                const element = $(selector);
                if (element.length > 0) {
                    content = element.html();
                    break;
                }
            }

            if (!content) {
                content = $('body').html();
            }

            // Clean up the content
            content = this.cleanContent(content, $);

            // Save the content
            const filename = this.sanitizeFilename(title) + '.md';
            const filepath = path.join(this.outputDir, filename);
            
            const markdown = this.convertToMarkdown(content, title, url);
            fs.writeFileSync(filepath, markdown);
            
            console.log(`✅ Saved: ${filename}`);

            // Find links to other documentation pages
            const links = [];
            $('a[href]').each((i, el) => {
                const href = $(el).attr('href');
                const linkText = $(el).text().trim();
                
                if (href && href.startsWith('/developers/docs/') && linkText) {
                    const fullUrl = 'https://discord.com' + href;
                    links.push({ url: fullUrl, title: linkText });
                }
            });

            return links;

        } catch (error) {
            console.error(`❌ Error scraping ${url}:`, error.message);
            return [];
        }
    }

    cleanContent(html, $) {
        // Remove unwanted elements
        $('.sidebar, .navigation, .footer, .header, .breadcrumb').remove();
        $('script, style, nav, .nav').remove();
        
        return $.html();
    }

    convertToMarkdown(html, title, url) {
        let markdown = `# ${title}\n\n`;
        markdown += `**Source:** ${url}\n\n`;
        markdown += `**Scraped:** ${new Date().toISOString()}\n\n`;
        markdown += '---\n\n';

        // Basic HTML to Markdown conversion
        html = html
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
            .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple newlines
            .trim();

        return markdown;
    }

    sanitizeFilename(title) {
        return title
            .replace(/[^a-zA-Z0-9\s-_]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase();
    }

    async scrapeAll() {
        console.log('🚀 Starting Discord API documentation scrape...');
        
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        // Start with main documentation pages
        const mainPages = [
            { url: 'https://discord.com/developers/docs/intro', title: 'Introduction' },
            { url: 'https://discord.com/developers/docs/getting-started', title: 'Getting Started' },
            { url: 'https://discord.com/developers/docs/topics/oauth2', title: 'OAuth2' },
            { url: 'https://discord.com/developers/docs/topics/gateway', title: 'Gateway' },
            { url: 'https://discord.com/developers/docs/topics/rpc', title: 'RPC' },
            { url: 'https://discord.com/developers/docs/topics/voice-connections', title: 'Voice Connections' },
            { url: 'https://discord.com/developers/docs/topics/rate-limits', title: 'Rate Limits' },
            { url: 'https://discord.com/developers/docs/topics/opcodes-and-status-codes', title: 'Opcodes and Status Codes' },
            { url: 'https://discord.com/developers/docs/topics/permissions', title: 'Permissions' },
            { url: 'https://discord.com/developers/docs/topics/teams', title: 'Teams' },
            { url: 'https://discord.com/developers/docs/topics/oauth2', title: 'OAuth2' },
            { url: 'https://discord.com/developers/docs/topics/gateway', title: 'Gateway' },
            { url: 'https://discord.com/developers/docs/topics/rpc', title: 'RPC' },
            { url: 'https://discord.com/developers/docs/topics/voice-connections', title: 'Voice Connections' },
            { url: 'https://discord.com/developers/docs/topics/rate-limits', title: 'Rate Limits' },
            { url: 'https://discord.com/developers/docs/topics/opcodes-and-status-codes', title: 'Opcodes and Status Codes' },
            { url: 'https://discord.com/developers/docs/topics/permissions', title: 'Permissions' },
            { url: 'https://discord.com/developers/docs/topics/teams', title: 'Teams' }
        ];

        const allLinks = [];
        
        for (const page of mainPages) {
            const links = await this.scrapePage(page.url, page.title);
            if (links && Array.isArray(links)) {
                allLinks.push(...links);
            }
            await this.wait(this.delay);
        }

        // Scrape discovered links
        console.log(`\n🔍 Found ${allLinks.length} additional pages to scrape...`);
        
        for (const link of allLinks.slice(0, 50)) { // Limit to first 50 to avoid overwhelming
            await this.scrapePage(link.url, link.title);
            await this.wait(this.delay);
        }

        console.log('\n✅ Discord API documentation scrape completed!');
        console.log(`📁 Files saved to: ${this.outputDir}`);
    }
}

// Run the scraper
if (require.main === module) {
    const scraper = new DiscordAPIScraper();
    scraper.scrapeAll().catch(console.error);
}

module.exports = DiscordAPIScraper;
