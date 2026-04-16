import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'divisions'; // divisions, districts, upazilas, unions

  try {
    const filePath = path.join(process.cwd(), 'node_modules', 'bd-geodata', 'data', `${type}.json`);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    // Sort alphabetically by bn_name
    data.sort((a, b) => {
      if (a.bn_name && b.bn_name) return a.bn_name.localeCompare(b.bn_name, 'bn');
      if (a.name && b.name) return a.name.localeCompare(b.name);
      return 0;
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Geodata Error:", error);
    return NextResponse.json({ error: 'Data not found' }, { status: 404 });
  }
}
