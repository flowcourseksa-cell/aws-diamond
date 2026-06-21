const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'app/(admin)/admin-khaled-ksa-aws-2026-org/exams/[examId]/builder/page.tsx',
  'app/(admin)/admin-khaled-ksa-aws-2026-org/exams/page.tsx',
  'app/(admin)/admin-khaled-ksa-aws-2026-org/page.tsx',
  'app/login/page.tsx',
  'app/onboarding/page.tsx',
  'components/admin/admin-sidebar.tsx',
  'middleware.ts'
];

for (const relPath of filesToUpdate) {
  const fullPath = path.join('f:\\TKHSAS', relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    // Replace exact `/admin` matching strings, taking care not to replace `/admin-khaled...`
    // We can just use a regex that matches `/admin` not followed by `-khaled`
    content = content.replace(/\/admin(?!-khaled-ksa-aws-2026-org)/g, '/admin-khaled-ksa-aws-2026-org');
    fs.writeFileSync(fullPath, content);
    console.log('Updated:', relPath);
  } else {
    console.warn('Not found:', relPath);
  }
}
