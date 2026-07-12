const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../lib/supabase/services');
const files = fs.readdirSync(targetDir).filter(f => f.endsWith('-actions.ts'));

for (const file of files) {
  const filePath = path.join(targetDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already contains import
  if (!content.includes('import { verifyAdminAccess }')) {
    content = 'import { verifyAdminAccess } from "@/lib/supabase/verify-admin";\n' + content;
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Added import to ${file}`);
  }
}
