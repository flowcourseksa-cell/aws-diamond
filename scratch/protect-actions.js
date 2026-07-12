const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../lib/supabase/services');
const files = fs.readdirSync(targetDir).filter(f => f.endsWith('-actions.ts'));

for (const file of files) {
  const filePath = path.join(targetDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already contains verifyAdminAccess
  if (content.includes('verifyAdminAccess')) continue;

  const importStatement = `import { verifyAdminAccess } from "@/lib/supabase/verify-admin";\n`;
  content = content.replace('"use server";\n', `"use server";\n\n${importStatement}`);

  // Regex to find exported async functions
  const fnRegex = /export async function\s+(\w+)\s*\([^)]*\)\s*(?::\s*[^\{]+)?\s*\{/g;
  
  content = content.replace(fnRegex, (match) => {
    return `${match}\n  await verifyAdminAccess();`;
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${file}`);
}
