const fs = require('fs');
let c = fs.readFileSync('src/app/api/ai-vision/route.js', 'utf8');

// Change model to gemini-1.5-flash
c = c.replace(
  'gemini-2.0-flash:generateContent',
  'gemini-1.5-flash:generateContent'
);

// Better error messages
c = c.replace(
  "return NextResponse.json({ error: 'AI service temporarily unavailable or key is invalid.' }, { status: 503 });",
  "console.error('[AI Vision] API Error:', result.error); return NextResponse.json({ error: `AI Error: ${result.error?.message || 'Vision service unavailable'}` }, { status: 503 });"
);

fs.writeFileSync('src/app/api/ai-vision/route.js', c, 'utf8');
console.log('Fixed AI Vision model and errors');
