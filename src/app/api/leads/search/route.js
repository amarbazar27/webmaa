import { NextResponse } from 'next/server';

// Website status checker
async function checkWebsiteStatus(url) {
  if (!url) return { status: 'no_website', label: 'No Website', working: false };
  
  try {
    // Normalize URL
    let checkUrl = url;
    if (!checkUrl.startsWith('http')) checkUrl = 'https://' + checkUrl;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    
    const res = await fetch(checkUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    clearTimeout(timeout);
    
    if (res.status >= 200 && res.status < 400) {
      return { status: 'working', label: 'Working', working: true, url: checkUrl };
    } else {
      return { status: 'broken', label: `Broken (${res.status})`, working: false, url: checkUrl };
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      return { status: 'broken', label: 'Timeout', working: false, url };
    }
    return { status: 'broken', label: 'Unreachable', working: false, url };
  }
}

// Clean email - filter generic ones
function isGenericEmail(email) {
  const genericPrefixes = ['info', 'support', 'sales', 'admin', 'contact', 'help', 'hello', 'office', 'noreply', 'no-reply'];
  const lower = email.toLowerCase();
  return genericPrefixes.some(p => lower.startsWith(p + '@'));
}

// Extract emails from text
function extractEmails(text) {
  if (!text) return [];
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const found = text.match(emailRegex) || [];
  return [...new Set(found)].filter(e => !isGenericEmail(e));
}

// Extract phone numbers from text
function extractPhones(text) {
  if (!text) return [];
  const phoneRegex = /(\+?880|0)[\s\-]?1[3-9]\d{8}/g;
  const found = text.match(phoneRegex) || [];
  return [...new Set(found.map(p => p.replace(/[\s\-]/g, '')))];
}

// Search using Google Places API (New)
async function searchGooglePlaces(query, location, apiKey) {
  const body = {
    textQuery: `${query} in ${location}`,
    maxResultCount: 20,
    languageCode: 'en',
  };

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.id,places.shortFormattedAddress'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Places API error: ${res.status} - ${err}`);
  }

  const data = await res.json();
  return data.places || [];
}

// Try to find Facebook page via Google Search
async function findFacebookPage(businessName, location, serpApiKey) {
  if (!serpApiKey) return null;
  
  try {
    const query = encodeURIComponent(`${businessName} ${location} site:facebook.com`);
    const res = await fetch(`https://serpapi.com/search?q=${query}&api_key=${serpApiKey}&engine=google&num=3`);
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const results = data.organic_results || [];
    
    for (const r of results) {
      if (r.link && r.link.includes('facebook.com')) {
        return r.link;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(request) {
  try {
    const { query, location, includeWorking = false } = await request.json();
    
    if (!query || !location) {
      return NextResponse.json({ error: 'Query and location are required' }, { status: 400 });
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    const serpApiKey = process.env.SERP_API_KEY;

    if (!googleApiKey) {
      return NextResponse.json({ 
        error: 'GOOGLE_MAPS_API_KEY not configured. Please add it to .env.local',
        demo: true,
        leads: getDemoLeads()
      }, { status: 200 });
    }

    // Step 1: Get businesses from Google Places
    const places = await searchGooglePlaces(query, location, googleApiKey);
    
    // Step 2: For each place, check website and find Facebook
    const leads = [];
    
    for (const place of places) {
      const name = place.displayName?.text || 'Unknown';
      const address = place.formattedAddress || place.shortFormattedAddress || '';
      const phone = place.nationalPhoneNumber || '';
      const websiteUrl = place.websiteUri || '';
      
      // Check website status
      const siteStatus = await checkWebsiteStatus(websiteUrl);
      
      // Skip if working website and includeWorking is false
      if (siteStatus.working && !includeWorking) continue;
      
      // Try to find Facebook page
      const facebookUrl = await findFacebookPage(name, location, serpApiKey);
      
      const lead = {
        id: place.id || Math.random().toString(36).substr(2, 9),
        name,
        address,
        phone,
        email: '',
        websiteUrl: websiteUrl || '',
        websiteStatus: siteStatus,
        facebookUrl: facebookUrl || '',
        source: 'Google Places',
      };
      
      leads.push(lead);
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    }

    return NextResponse.json({ leads, total: leads.length });
    
  } catch (error) {
    console.error('Lead search error:', error);
    return NextResponse.json({ 
      error: error.message || 'Search failed',
      leads: getDemoLeads(),
      demo: true
    }, { status: 200 });
  }
}

// Demo leads for when API key is not configured
function getDemoLeads() {
  return [
    {
      id: 'demo1',
      name: 'Camera King BD',
      address: 'Elephant Road, Dhaka-1205',
      phone: '+8801711234567',
      email: 'cameraking.bd@gmail.com',
      websiteUrl: '',
      websiteStatus: { status: 'no_website', label: 'No Website', working: false },
      facebookUrl: 'https://www.facebook.com/camerakingbd',
      source: 'Demo Data',
    },
    {
      id: 'demo2',
      name: 'Pixel Photo House',
      address: 'Mirpur 10, Dhaka',
      phone: '+8801812345678',
      email: 'pixelphotobd@gmail.com',
      websiteUrl: 'http://pixelphotohouse.com',
      websiteStatus: { status: 'broken', label: 'Broken (404)', working: false, url: 'http://pixelphotohouse.com' },
      facebookUrl: 'https://www.facebook.com/pixelphotohouse',
      source: 'Demo Data',
    },
    {
      id: 'demo3',
      name: 'Lens Master Studio',
      address: 'Gulshan 1, Dhaka',
      phone: '+8801913456789',
      email: 'lensmasterbd@gmail.com',
      websiteUrl: '',
      websiteStatus: { status: 'no_website', label: 'No Website', working: false },
      facebookUrl: 'https://www.facebook.com/lensmasterbd',
      source: 'Demo Data',
    },
    {
      id: 'demo4',
      name: 'Fashion House Chittagong',
      address: 'Agrabad, Chittagong',
      phone: '+8801611234567',
      email: 'fashionhouse.ctg@gmail.com',
      websiteUrl: '',
      websiteStatus: { status: 'no_website', label: 'No Website', working: false },
      facebookUrl: 'https://www.facebook.com/fashionhousectg',
      source: 'Demo Data',
    },
    {
      id: 'demo5',
      name: 'Mawna Electronics',
      address: 'Banani, Dhaka',
      phone: '+8801511234567',
      email: 'mawnaelectronics@gmail.com',
      websiteUrl: 'https://mawnaelectronics.bd',
      websiteStatus: { status: 'broken', label: 'Timeout', working: false, url: 'https://mawnaelectronics.bd' },
      facebookUrl: 'https://www.facebook.com/mawnaelectronics',
      source: 'Demo Data',
    },
  ];
}
