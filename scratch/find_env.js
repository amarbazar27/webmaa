const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\missi\\.gemini\\antigravity\\brain\\115f063f-5638-4f9a-b2be-41c9e6ee51d5\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log("Log file not found at:", logPath);
  process.exit(1);
}

console.log("Scanning log for private keys and client emails...");
const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

let count = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('FIREBASE_PRIVATE_KEY') || line.includes('private_key') || line.includes('FIREBASE_CLIENT_EMAIL')) {
    // Avoid listing the find_env.js write_to_file itself if we can
    if (line.includes('find_env.js') && count > 0) continue;
    
    count++;
    console.log(`\n[Match ${count}] Line ${i + 1}:`);
    try {
      const parsed = JSON.parse(line);
      console.log("Type:", parsed.type, "Status:", parsed.status);
      console.log("Content summary:", (parsed.content || '').substring(0, 300));
      // Look for tool calls or results containing envs
      if (parsed.tool_calls) {
        console.log("Tool calls exist:");
        parsed.tool_calls.forEach(tc => {
          console.log(`  Tool: ${tc.name}`);
          if (tc.args && tc.args.CodeContent) {
            console.log(`  CodeContent: ${tc.args.CodeContent.substring(0, 300)}...`);
          }
        });
      }
      if (parsed.output) {
        console.log("Output summary:", String(parsed.output).substring(0, 300));
      }
    } catch (e) {
      console.log("Snippet:", line.substring(0, 500));
    }
  }
}

console.log(`\nScan finished. Total matches: ${count}`);
