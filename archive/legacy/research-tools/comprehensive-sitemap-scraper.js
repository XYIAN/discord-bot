#!/usr/bin/env node

// Comprehensive Sitemap Scraper
// Scrapes all URLs from all 14 sitemaps in the Theria Games sitemap index

const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Sitemap index URL
const SITEMAP_INDEX_URL = 'https://theriagames.com/sitemap_index.xml';

async function scrapeAllSitemaps() {
    console.log('🚀 Starting Comprehensive Sitemap Scraper...');
    console.log('===========================================');
    
    try {
        // First, get all sitemap URLs from the index
        console.log('📋 Fetching sitemap index...');
        const sitemapIndexResponse = await axios.get(SITEMAP_INDEX_URL);
        const sitemapIndexContent = sitemapIndexResponse.data;
        
        // Extract all sitemap URLs
        const sitemapUrls = [];
        const sitemapMatches = sitemapIndexContent.match(/<loc>(.*?)<\/loc>/g);
        if (sitemapMatches) {
            sitemapMatches.forEach(match => {
                const url = match.replace(/<\/?loc>/g, '');
                if (url.includes('theriagames.com')) {
                    sitemapUrls.push(url);
                }
            });
        }
        
        console.log(`📊 Found ${sitemapUrls.length} sitemaps to process`);
        
        // Collect all URLs from all sitemaps
        const allUrls = [];
        const urlCategories = {
            guides: [],
            heroes: [],
            chapters: [],
            events: [],
            other: []
        };
        
        for (let i = 0; i < sitemapUrls.length; i++) {
            const sitemapUrl = sitemapUrls[i];
            console.log(`\n📄 [${i + 1}/${sitemapUrls.length}] Processing sitemap: ${sitemapUrl}`);
            
            try {
                const sitemapResponse = await axios.get(sitemapUrl);
                const sitemapContent = sitemapResponse.data;
                
                // Extract URLs from this sitemap
                const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);
                if (urlMatches) {
                    urlMatches.forEach(match => {
                        const url = match.replace(/<\/?loc>/g, '');
                        if (url.includes('theriagames.com') && url.includes('archero-2')) {
                            allUrls.push(url);
                            
                            // Categorize URLs
                            if (url.includes('/guide/') || url.includes('/guides/')) {
                                urlCategories.guides.push(url);
                            } else if (url.includes('/hero') || url.includes('/character')) {
                                urlCategories.heroes.push(url);
                            } else if (url.includes('/chapter')) {
                                urlCategories.chapters.push(url);
                            } else if (url.includes('/event') || url.includes('/arena')) {
                                urlCategories.events.push(url);
                            } else {
                                urlCategories.other.push(url);
                            }
                        }
                    });
                }
                
                console.log(`  ✅ Extracted ${urlMatches ? urlMatches.length : 0} URLs`);
                
            } catch (error) {
                console.log(`  ❌ Failed to process sitemap: ${error.message}`);
            }
            
            // Small delay between sitemap requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('\n📊 SITEMAP ANALYSIS COMPLETE!');
        console.log('=============================');
        console.log(`📊 Total URLs found: ${allUrls.length}`);
        console.log(`📚 Guides: ${urlCategories.guides.length}`);
        console.log(`👥 Heroes: ${urlCategories.heroes.length}`);
        console.log(`📖 Chapters: ${urlCategories.chapters.length}`);
        console.log(`🎯 Events: ${urlCategories.events.length}`);
        console.log(`📄 Other: ${urlCategories.other.length}`);
        
        // Save URL list for scraping
        const urlListFile = path.join(__dirname, '..', 'data', `theria-all-urls-${Date.now()}.json`);
        fs.writeFileSync(urlListFile, JSON.stringify({
            timestamp: new Date().toISOString(),
            totalUrls: allUrls.length,
            categories: urlCategories,
            allUrls: allUrls
        }, null, 2));
        
        console.log(`\n📁 URL list saved to: ${urlListFile}`);
        console.log('\n🎯 READY FOR SCRAPING!');
        console.log('======================');
        console.log('Next step: Run the actual content scraper with these URLs');
        
        return {
            totalUrls: allUrls.length,
            categories: urlCategories,
            allUrls: allUrls
        };
        
    } catch (error) {
        console.error('❌ Sitemap scraper failed:', error);
        return null;
    }
}

// Run the sitemap scraper
scrapeAllSitemaps().catch(console.error);
