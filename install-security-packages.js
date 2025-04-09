const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Installing security packages...');

try {
  // Install all required security packages
  execSync('npm install helmet express-rate-limit cors', { stdio: 'inherit' });
  
  console.log('\n✅ Successfully installed security packages!');
  console.log('\nInstalled packages:');
  console.log('- helmet: For securing HTTP headers');
  console.log('- express-rate-limit: For rate limiting to prevent abuse');
  console.log('- cors: For Cross-Origin Resource Sharing protection');
  
  console.log('\n🚀 You can now restart your server with:');
  console.log('npm start');
} catch (error) {
  console.error('\n❌ Failed to install packages:', error.message);
  console.log('\nYou can manually install the packages with:');
  console.log('npm install helmet express-rate-limit cors');
}
