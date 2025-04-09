const fetch = require('node-fetch');

async function testRateLimiting() {
  console.log('Testing general rate limiting...');
  
  // Send 105 requests to test general rate limiting
  for (let i = 1; i <= 105; i++) {
    try {
      const response = await fetch('http://localhost:3005/');
      console.log(`Request ${i}: Status ${response.status}`);
      
      // Log rate limit headers if they exist
      const rateLimitLimit = response.headers.get('ratelimit-limit');
      const rateLimitRemaining = response.headers.get('ratelimit-remaining');
      if (rateLimitLimit) {
        console.log(`  Limit: ${rateLimitLimit}, Remaining: ${rateLimitRemaining}`);
      }
      
    } catch (error) {
      console.error(`Request ${i} failed:`, error.message);
    }
  }
  
  console.log('\nTesting authentication route rate limiting...');
  
  // Send 15 requests to test auth rate limiting
  for (let i = 1; i <= 15; i++) {
    try {
      const response = await fetch('http://localhost:3005/login', {
        method: 'GET'
      });
      console.log(`Auth Request ${i}: Status ${response.status}`);
    } catch (error) {
      console.error(`Auth Request ${i} failed:`, error.message);
    }
  }
}

testRateLimiting();
