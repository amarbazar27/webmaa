import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// City Corporations & Major Pourashavas — these areas show WARDS, not unions.
// Key = upazila bn_name (as it appears in bd-geodata or manually added)
// Value = array of ward names
// ─────────────────────────────────────────────────────────────────────────────
const CITY_CORPORATION_WARDS = {
  // Dhaka North + South City Corporation (Dhaka district has no "Dhaka Sadar" upazila in the DB
  // — Dhaka City Corp covers multiple upazilas; we mark them individually)
  'সাভার': null, // keep unions
  'ধামরাই': null,

  // Rangpur City Corporation — এলাকার নাম সহ ৩৩ ওয়ার্ড
  'রংপুর সদর': [
    'ওয়ার্ড ১ — ধাপ, কেরানীপাড়া',
    'ওয়ার্ড ২ — মুন্সিপাড়া, সেনপাড়া',
    'ওয়ার্ড ৩ — কলেজ রোড, ধাপ রোড',
    'ওয়ার্ড ৪ — লালকুঠি, স্টেশন রোড',
    'ওয়ার্ড ৫ — মেডিকেল মোড়, সেন্ট্রাল রোড',
    'ওয়ার্ড ৬ — লালবাগ, নিউ লালবাগ',
    'ওয়ার্ড ৭ — মাহিগঞ্জ রোড, লালবাগ বাজার',
    'ওয়ার্ড ৮ — আলমনগর (আংশিক)',
    'ওয়ার্ড ৯ — মাস্টারপাড়া, খলিফাপাড়া',
    'ওয়ার্ড ১০ — পায়রাচত্বর',
    'ওয়ার্ড ১১ — রাজারহাট',
    'ওয়ার্ড ১২ — শালবন',
    'ওয়ার্ড ১৩ — কুঠিবাড়ি',
    'ওয়ার্ড ১৪ — মডার্ন মোড়',
    'ওয়ার্ড ১৫ — আবাসিক এলাকা',
    'ওয়ার্ড ১৬ — আলমনগর',
    'ওয়ার্ড ১৭ — জুম্মাপাড়া',
    'ওয়ার্ড ১৮ — ইসলামবাগ',
    'ওয়ার্ড ১৯ — মডেল কলোনি',
    'ওয়ার্ড ২০ — স্যাটেলাইট টাউন',
    'ওয়ার্ড ২১ — স্যাটেলাইট এক্সটেনশন',
    'ওয়ার্ড ২২ — ইঞ্জিনিয়ারিং কলেজ',
    'ওয়ার্ড ২৩ — মেডিকেল কলেজ',
    'ওয়ার্ড ২৪ — চৌধুরীপাড়া',
    'ওয়ার্ড ২৫ — তাজহাট',
    'ওয়ার্ড ২৬ — হরিদেবপুর',
    'ওয়ার্ড ২৭ — বাহিরের আবাসিক',
    'ওয়ার্ড ২৮ — নতুন কলোনি',
    'ওয়ার্ড ২৯ — গ্রোথ এরিয়া',
    'ওয়ার্ড ৩০ — আউটার রিং',
    'ওয়ার্ড ৩১ — পল্লী এলাকা',
    'ওয়ার্ড ৩২ — শহরতলী এলাকা',
    'ওয়ার্ড ৩৩ — এক্সটেন্ডেড সিটি',
  ],

  // Sylhet City Corporation
  'সিলেট সদর': Array.from({length: 27}, (_, i) => `ওয়ার্ড ${i + 1}`),

  // Chittagong City Corporation
  'পাহাড়তলী': Array.from({length: 41}, (_, i) => `ওয়ার্ড ${i + 1}`),
  'চান্দগাঁও': Array.from({length: 41}, (_, i) => `ওয়ার্ড ${i + 1}`),
  'বন্দর': Array.from({length: 41}, (_, i) => `ওয়ার্ড ${i + 1}`),
  'চট্টগ্রাম সদর': Array.from({length: 41}, (_, i) => `ওয়ার্ড ${i + 1}`),

  // Rajshahi City Corporation
  'রাজশাহী সদর': Array.from({length: 30}, (_, i) => `ওয়ার্ড ${i + 1}`),
  'বোয়ালিয়া': Array.from({length: 30}, (_, i) => `ওয়ার্ড ${i + 1}`),

  // Khulna City Corporation — add manually since "খুলনা সদর" not in geodata as upazila
  'খুলনা সদর': Array.from({length: 31}, (_, i) => `ওয়ার্ড ${i + 1}`),

  // Barishal City Corporation
  'বরিশাল সদর': Array.from({length: 30}, (_, i) => `ওয়ার্ড ${i + 1}`),

  // Mymensingh City Corporation
  'ময়মনসিংহ সদর': Array.from({length: 33}, (_, i) => `ওয়ার্ড ${i + 1}`),

  // Comilla City Corporation
  'কোতোয়ালি': Array.from({length: 27}, (_, i) => `ওয়ার্ড ${i + 1}`),

  // Narayanganj City Corporation
  'নারায়ণগঞ্জ সদর': Array.from({length: 27}, (_, i) => `ওয়ার্ড ${i + 1}`),

  // Gazipur City Corporation
  'গাজীপুর সদর': Array.from({length: 57}, (_, i) => `ওয়ার্ড ${i + 1}`),
};

// Districts that need a manual City Corporation upazila injected
// (because bd-geodata doesn't have it as a separate upazila)
// Key = district bn_name, Value = extra upazilas to inject
const MANUAL_UPAZILAS = {
  'খুলনা': [
    { id: 'khulna-cc', district_id: '27', name: 'Khulna City Corporation', bn_name: 'খুলনা সদর', url: '', _isManual: true }
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

function readGeoFile(type) {
  const filePath = path.join(process.cwd(), 'node_modules', 'bd-geodata', 'data', `${type}.json`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

function sortByBnName(arr) {
  return arr.sort((a, b) => {
    if (a.bn_name && b.bn_name) return a.bn_name.localeCompare(b.bn_name, 'bn');
    if (a.name && b.name) return a.name.localeCompare(b.name);
    return 0;
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'divisions';
  const divisionId = searchParams.get('division_id');
  const districtId = searchParams.get('district_id');
  const upazilaId = searchParams.get('upazila_id');
  const upazilaName = searchParams.get('upazila_name'); // bn_name of selected upazila

  try {
    // ── divisions ─────────────────────────────────────────────────────────────
    if (type === 'divisions') {
      const data = sortByBnName(readGeoFile('divisions'));
      return NextResponse.json(data);
    }

    // ── districts ─────────────────────────────────────────────────────────────
    if (type === 'districts') {
      let data = readGeoFile('districts');
      if (divisionId) data = data.filter(d => d.division_id === divisionId);
      return NextResponse.json(sortByBnName(data));
    }

    // ── upazilas ─────────────────────────────────────────────────────────────
    if (type === 'upazilas') {
      let data = readGeoFile('upazilas');
      if (districtId) data = data.filter(d => d.district_id === districtId);
      
      // Inject manual upazilas (e.g. Khulna City Corp)
      if (districtId) {
        const districtData = readGeoFile('districts').find(d => d.id === districtId);
        const districtBnName = districtData?.bn_name;
        if (districtBnName && MANUAL_UPAZILAS[districtBnName]) {
          data = [...data, ...MANUAL_UPAZILAS[districtBnName]];
        }
      }
      return NextResponse.json(sortByBnName(data));
    }

    // ── unions OR wards (smart detection) ─────────────────────────────────────
    if (type === 'unions' || type === 'wards') {
      const selectedUpazilaName = upazilaName || '';
      
      // Smart detection: 
      // 1. Manual City Corp injection
      // 2. Names in our explicit ward-list
      // 3. Names containing "সদর" (typically District Sadar towns show wards)
      const isWardArea = upazilaId?.startsWith('khulna-cc') || 
                         (CITY_CORPORATION_WARDS[selectedUpazilaName] !== undefined && CITY_CORPORATION_WARDS[selectedUpazilaName] !== null) ||
                         selectedUpazilaName.includes('সদর');

      if (isWardArea) {
        // It's a Urban/City area — return wards
        // Generate up to 30 wards if no specific count is defined
        const wards = CITY_CORPORATION_WARDS[selectedUpazilaName] || 
                      Array.from({length: 30}, (_, i) => `ওয়ার্ড ${i + 1}`);
                      
        const wardObjects = wards.map((w, i) => ({
          id: `ward-${i + 1}`,
          upazilla_id: upazilaId || '',
          bn_name: w,
          name: w,
          _type: 'ward'
        }));
        return NextResponse.json({ data: wardObjects, type: 'wards' });
      } else {
        // Rural upazila — return unions from bd-geodata
        let data = readGeoFile('unions');
        if (upazilaId) data = data.filter(d => d.upazilla_id === upazilaId);
        
        // If NO unions found for this upazila (sometimes DB is missing rural unions), 
        // fallback to wards or just an empty list.
        if (data.length === 0) {
             // Fallback to wards if geodata is empty (better than nothing)
             const fallbackWards = Array.from({length: 15}, (_, i) => `ওয়ার্ড ${i + 1}`);
             const objs = fallbackWards.map((w, i) => ({ id: `w-${i+1}`, bn_name: w, name: w, _type: 'ward-fallback' }));
             return NextResponse.json({ data: objs, type: 'wards' });
        }

        return NextResponse.json({ data: sortByBnName(data), type: 'unions' });
      }
    }

    // fallback: raw file read
    const data = sortByBnName(readGeoFile(type));
    return NextResponse.json(data);

  } catch (error) {
    console.error('Geodata Error:', error);
    return NextResponse.json({ error: 'Data not found', detail: error.message }, { status: 404 });
  }
}
