const fs = require('fs');

// Function to update icon URLs in a file
function updateIcons(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  
  // Replace all CoinGecko icon URLs with CoinCap CDN
  // Pattern: https://assets.coingecko.com/coins/images/*/large/*.* or *.jpg
  content = content.replace(
    /icon:\s*"https:\/\/assets\.coingecko\.com\/coins\/images\/\d+\/large\/([^"]+)"/g,
    (match, filename) => {
      // Extract the base name without extension
      const baseName = filename.replace(/\.(png|jpg|jpeg)$/, '').toLowerCase();
      return `icon: "https://assets.coincap.io/assets/icons/${baseName}@2x.png"`;
    }
  );
  
  fs.writeFileSync(filename, content);
  console.log(`✅ Updated ${filename}`);
}

// Update all token files
['ethereum-tokens.ts', 'bnb-tokens.ts', 'tron-tokens.ts', 'solana-tokens.ts'].forEach(file => {
  updateIcons(file);
});

console.log('\n✨ All token icon URLs updated to CoinCap CDN!');
