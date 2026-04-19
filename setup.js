#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🚀 TaskFlow AI - Setup Script\n');

// Create .env from example
const envExample = path.join(__dirname, 'backend', '.env.example');
const envFile = path.join(__dirname, 'backend', '.env');

if (!fs.existsSync(envFile)) {
  fs.copyFileSync(envExample, envFile);
  console.log('✅ Created backend/.env from .env.example');
  console.log('⚠️  Please edit backend/.env and add your:');
  console.log('   - MONGODB_URI');
  console.log('   - JWT_SECRET');
  console.log('   - OPENAI_API_KEY\n');
} else {
  console.log('ℹ️  backend/.env already exists, skipping...');
}

// Create uploads directory
const uploadsDir = path.join(__dirname, 'backend', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created backend/uploads/ directory');
}

console.log('\n📦 Installing dependencies...\n');

try {
  console.log('Installing backend dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, 'backend'), stdio: 'inherit' });
  
  console.log('\nInstalling frontend dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
  
  console.log('\n✅ All dependencies installed!\n');
  console.log('🎯 Next steps:');
  console.log('1. Edit backend/.env with your credentials');
  console.log('2. Run: cd backend && npm run dev');
  console.log('3. Run: cd frontend && npm run dev');
  console.log('4. Open http://localhost:5173\n');
} catch (err) {
  console.error('❌ Installation failed:', err.message);
  process.exit(1);
}
