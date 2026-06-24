const fs = require('fs');

const src = "C:\\Users\\missi\\.gemini\\antigravity\\brain\\tempmediaStorage\\media__1781317768711.jpg";
const dest = "C:\\Users\\missi\\.gemini\\antigravity\\brain\\b01d7cad-ac08-4c73-8301-ded83731143f\\media__1781317768711.jpg";

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log("Image copied successfully!");
} else {
  console.log("Source image does not exist!");
}
