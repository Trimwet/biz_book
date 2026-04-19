const fs = require('fs');
const path = 'backend/routes/vendor.js';

// Read the file
let content = fs.readFileSync(path, 'utf8');

// Direct fixes for broken patterns
const directFixes = [
  [/wc \+= ' AND sr\.report_date >= \r?\n\s*\+ pi;/, "wc += ' AND sr.report_date >= $' + pi;"],
  [/wc \+= ' AND sr\.report_date <= \r?\n\s*\+ pi;/, "wc += ' AND sr.report_date <= $' + pi;"],
  [/wc \+= ' AND sr\.product_id = \r?\n\s*\+ pi;/, "wc += ' AND sr.product_id = $' + pi;"],
  [/wc \+= ' AND sr\.product_name ILIKE \r?\n\s*\+ pi;/, "wc += ' AND sr.product_name ILIKE $' + pi;"],
  [/dateCondition = 'sr\.report_date >= \r?\n\s*\+ pi;/, "dateCondition = 'sr.report_date >= $' + pi;"],
  [/dateCondition \+= ' AND sr\.report_date <= \r?\n\s*\+ pi;/, "dateCondition += ' AND sr.report_date <= $' + pi;"],
  [/ph = ids\.map\(\(_, i\) => '\r?\n\s*\+ \(i \+ 1\)\)\.join/, "ph = ids.map((_, i) => '$' + (i + 1)).join"],
  [/LIMIT \${pi} OFFSET \${pi \+ 1}/, 'LIMIT $${pi} OFFSET $${pi + 1}'],
];

let fixed = false;
for (const [pattern, replacement] of directFixes) {
  const before = content;
  content = content.replace(pattern, replacement);
  if (content !== before) {
    console.log('Fixed pattern:', pattern.toString(), '->', replacement);
    fixed = true;
  }
}

if (fixed) {
  fs.writeFileSync(path, content, 'utf8');
  console.log('File updated successfully');
} else {
  console.log('No patterns matched - file may already be fixed or pattern is different');
}

// Now check syntax
try {
  new Function(content);
  console.log('Syntax check: OK');
} catch (e) {
  console.log('Syntax error:', e.message);
  // Show problematic lines
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('+ pi;') || line.includes('report_date') || line.includes('product_id') || line.includes('product_name') || line.includes('ph = ids.map')) {
      console.log(`Line ${i+1}: ${line}`);
    }
  });
}
