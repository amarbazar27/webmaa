import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';
export const revalidate = 86400;

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'DESIGN.md');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  return new Response(fileContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
