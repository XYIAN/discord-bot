const fs = require('fs');

// Load the URL data
const data = JSON.parse(fs.readFileSync('data/theria-all-urls-1759704416831.json', 'utf8'));

console.log('🔍 CHECKING FIRST 10 URLs:');
console.log('==========================');
data.allUrls.slice(0, 10).forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
});

console.log('\n🎯 FILTERING PROBLEMATIC URLS:');
console.log('==============================');

// Filter out only the problematic menu/index pages
const filteredUrls = data.allUrls.filter(url => {
  const urlLower = url.toLowerCase();
  // Keep all URLs except the main menu/index pages
  return !urlLower.includes('/archero-2-wiki/') &&
         !urlLower.includes('/archero-2-guides/') &&
         !urlLower.includes('/archero-2-chapters/') &&
         !urlLower.includes('/archero-2-heroes/') &&
         !urlLower.includes('/archero-2-events/') &&
         !urlLower.includes('/archero-2-tools/') &&
         urlLower.includes('archero-2');
});

console.log(`📊 Original URLs: ${data.allUrls.length}`);
console.log(`📊 Filtered URLs: ${filteredUrls.length}`);
console.log('\n📋 FILTERED URLS (first 10):');
filteredUrls.slice(0, 10).forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
});

// Save filtered URLs
const filteredData = {
  ...data,
  allUrls: filteredUrls,
  totalUrls: filteredUrls.length
};

fs.writeFileSync('data/theria-filtered-urls.json', JSON.stringify(filteredData, null, 2));
console.log('\n✅ Filtered URLs saved to: data/theria-filtered-urls.json');
