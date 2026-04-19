const fs = require('fs');
const path = 'backend/routes/vendor.js';

// Read file
let content = fs.readFileSync(path, 'utf8');
let lines = content.split('\n');

console.log('Total lines:', lines.length);
console.log('Line 363 before:', JSON.stringify(lines[362]));

// Fix line 363
if (lines[362]) {
  lines[362] = "      if (start_date) { wc += ' AND sr.report_date >= $' + pi; params.push(start_date); pi++; }";
}
// Fix line 364
if (lines[363]) {
  lines[363] = "      if (end_date) { wc += ' AND sr.report_date <= $' + pi; params.push(end_date); pi++; }";
}
// Fix line 365
if (lines[364]) {
  lines[364] = "      if (product_id) { wc += ' AND sr.product_id = $' + pi; params.push(Number(product_id)); pi++; }";
}
// Fix line 366
if (lines[365]) {
  lines[365] = "      if (product_name) { wc += ' AND sr.product_name ILIKE $' + pi; params.push('%' + product_name + '%'); pi++; }";
}

// Find and fix dateCondition lines
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("dateCondition = 'sr.report_date >=") && !lines[i].includes("$' + pi")) {
    lines[i] = lines[i].replace("dateCondition = 'sr.report_date >=", "dateCondition = 'sr.report_date >= $' + pi;");
    console.log('Fixed dateCondition at line', i+1);
  }
  if (lines[i].includes("dateCondition += ' AND sr.report_date <=") && !lines[i].includes("$' + pi")) {
    lines[i] = lines[i].replace("dateCondition += ' AND sr.report_date <=", "dateCondition += ' AND sr.report_date <= $' + pi;");
    console.log('Fixed dateCondition+= at line', i+1);
  }
  // Fix ph line
  if (lines[i].includes("const ph = ids.map((_, i) => '") && lines[i].includes('+ (i + 1))')) {
    lines[i] = lines[i].replace(/const ph = ids\.map\(\(_, i\) => '\r?\n\s*\+ \(i \+ 1\)\)\.join/, "const ph = ids.map((_, i) => '$' + (i + 1)).join");
    console.log('Fixed ph line at line', i+1);
  }
  // Fix LIMIT pattern
  if (lines[i].includes('LIMIT ${pi} OFFSET ${pi + 1}')) {
    lines[i] = lines[i].replace('LIMIT ${pi} OFFSET ${pi + 1}', 'LIMIT $${pi} OFFSET $${pi + 1}');
    console.log('Fixed LIMIT at line', i+1);
  }
}

// Write back
const newContent = lines.join('\n');
fs.writeFileSync(path, newContent, 'utf8');
console.log('Wrote file');

// Syntax check
try {
  new Function(newContent);
  console.log('Syntax: OK');
} catch (e) {
  console.log('Syntax error:', e.message);
  // Show problematic lines
  const checkLines = newContent.split('\n');
  for (let i = 0; i < checkLines.length; i++) {
    if (checkLines[i].includes('+ pi;') && !checkLines[i].includes('$')) {
      console.log('Problem at line', i+1, ':', checkLines[i].substring(0, 100));
    }
  }
}
