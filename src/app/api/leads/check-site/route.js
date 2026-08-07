import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ status: 'no_website', label: 'No Website', working: false });
    }

    let checkUrl = url;
    if (!checkUrl.startsWith('http')) checkUrl = 'https://' + checkUrl;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const res = await fetch(checkUrl, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadBot/1.0)' }
      });
      clearTimeout(timeout);

      if (res.status >= 200 && res.status < 400) {
        return NextResponse.json({ status: 'working', label: 'Working ✓', working: true, url: checkUrl, httpStatus: res.status });
      } else {
        return NextResponse.json({ status: 'broken', label: `Broken (${res.status})`, working: false, url: checkUrl, httpStatus: res.status });
      }
    } catch (fetchErr) {
      clearTimeout(timeout);
      if (fetchErr.name === 'AbortError') {
        return NextResponse.json({ status: 'broken', label: 'Timeout', working: false, url: checkUrl });
      }
      return NextResponse.json({ status: 'broken', label: 'Unreachable', working: false, url: checkUrl });
    }
  } catch (error) {
    return NextResponse.json({ status: 'error', label: 'Check Failed', working: false }, { status: 200 });
  }
}
