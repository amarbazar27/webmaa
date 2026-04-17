const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/settings/page.js', 'utf8');
// Find the stale duplicate block - it starts right after the new Add button closes
// and ends before the {/* Selected areas */} comment
const START_MARKER = 'এলাকা যোগ করুন\r\n                  </button>\r\n\r\n\r\n                    <div';
const END_MARKER = '                </div>\r\n\r\n                {/* Selected areas */}';
const si = c.indexOf(START_MARKER);
const ei = c.indexOf(END_MARKER);
if (si !== -1 && ei !== -1) {
  // Replace from after "এলাকা যোগ করুন\r\n                  </button>" to before {/* Selected areas */}
  const keep_start = c.slice(0, si + 'এলাকা যোগ করুন\r\n                  </button>'.length);
  const keep_end = c.slice(ei + '                </div>'.length);
  c = keep_start + '\r\n                </div>\r\n' + keep_end;
  fs.writeFileSync('src/app/dashboard/settings/page.js', c, 'utf8');
  console.log('Fixed! Total lines:', c.split('\n').length);
} else {
  console.log('Markers not found. si=' + si + ' ei=' + ei);
  // Try to find approximate location
  const testIdx = c.indexOf('সার্ভিস এরিয়া হিসেবে যোগ করুন');
  console.log('Button text at:', testIdx);
}
