/**
 * Scheduler for Bnusa Platform maintenance tasks
 * 
 * This script sets up periodic tasks using node-cron
 * It can be run in the background as a service
 * 
 * Usage:
 * node scripts/scheduler.js
 */

require('dotenv').config();
const cron = require('node-cron');
const { execSync } = require('child_process');
const path = require('path');

console.log('Starting Bnusa Platform maintenance scheduler...');

// Function to run a script and log the output
function runScript(scriptName) {
  try {
    console.log(`\n[${new Date().toISOString()}] Running ${scriptName}...`);
    const scriptPath = path.join(__dirname, scriptName);
    const output = execSync(`node ${scriptPath}`, { encoding: 'utf8' });
    console.log(output);
    console.log(`[${new Date().toISOString()}] Completed ${scriptName}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error running ${scriptName}:`, error.message);
  }
}

// Schedule writer profile checks - run every day at 2:00 AM
cron.schedule('0 2 * * *', () => {
  runScript('check-writer-profiles.js');
});

// Schedule writer badge updates - run every day at 2:30 AM
cron.schedule('30 2 * * *', () => {
  runScript('update-writer-badges.js');
});

// Schedule article status checks - run every day at 3:00 AM
cron.schedule('0 3 * * *', () => {
  runScript('../fix-articles-status.js');
});

// Schedule slug validation - run weekly on Sunday at 4:00 AM
cron.schedule('0 4 * * 0', () => {
  runScript('../fix-article-slugs.js');
});

// Schedule database statistics and health check - run daily at 1:00 AM
cron.schedule('0 1 * * *', () => {
  runScript('../check-database.js');
});

console.log('Scheduler started. Tasks have been scheduled.');
console.log('The following tasks are scheduled:');
console.log('1. Writer Profile Check: Daily at 2:00 AM');
console.log('2. Writer Badge Update: Daily at 2:30 AM');
console.log('3. Article Status Check: Daily at 3:00 AM');
console.log('4. Slug Validation: Weekly on Sunday at 4:00 AM');
console.log('5. Database Health Check: Daily at 1:00 AM');
console.log('\nPress Ctrl+C to stop the scheduler');

// Keep the script running
process.stdin.resume(); 