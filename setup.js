const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Lillego Bot...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from env.example');
    console.log('⚠️  Please edit .env file with your Discord bot credentials\n');
  } else {
    console.log('❌ env.example file not found');
  }
} else {
  console.log('✅ .env file already exists\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  console.log('Run: npm install\n');
} else {
  console.log('✅ Dependencies already installed\n');
}

console.log('📋 Next steps:');
console.log('1. Edit .env file with your Discord bot token and client ID');
console.log('2. Run: npm install (if not already done)');
console.log('3. Run: npm run deploy (to register slash commands)');
console.log('4. Run: npm run dev (to start the bot)');
console.log('\n🎉 Setup complete!');
