const fs = require('fs');

let c = fs.readFileSync('src/app/api/ai/route.js', 'utf8');

const oldPrompt = "let systemText = \"Always greet with 'Assalamu Alaikum'. Never use 'Nomoskar'. Follow Muslim etiquette. Speak in Bengali for a Bangladeshi retail store.\";";
const newPrompt = "let systemText = \"You are an intelligent AI Shopping Assistant for a Bangladeshi retail store. Always greet with 'Assalamu Alaikum' and speak in natural Bengali. You must analyze what the user is ordering and proactively suggest related items, value-for-money alternatives, or currently trending items. Help them build their cart smartly and give personalized suggestions. Keep responses concise but helpful.\";";

if (c.includes(oldPrompt)) {
  c = c.replace(oldPrompt, newPrompt);
  fs.writeFileSync('src/app/api/ai/route.js', c, 'utf8');
  console.log('Updated AI prompt!');
} else {
  console.log('Old prompt not found.');
}
