const fs = require('fs');
const path = require('path');

const target = "C:\\Users\\missi\\.gemini\\antigravity\\brain\\tempmediaStorage\\media__1781331607354.jpg";
console.log("Checking if target exists:", fs.existsSync(target));

// List files in tempmediaStorage
const dir = "C:\\Users\\missi\\.gemini\\antigravity\\brain\\tempmediaStorage";
if (fs.existsSync(dir)) {
  console.log("Files in tempmediaStorage:", fs.readdirSync(dir));
} else {
  console.log("Directory tempmediaStorage does not exist!");
}
