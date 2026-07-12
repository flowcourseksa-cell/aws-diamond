const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../lib/supabase/services');
const files = fs.readdirSync(targetDir).filter(f => f.endsWith('-actions.ts'));

for (const file of files) {
  const filePath = path.join(targetDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // If the file starts with the import, and contains "use server", we fix it
  if (content.startsWith('import { verifyAdminAccess }')) {
    // Remove all instances of "use server"; or "use server"
    content = content.replace(/"use server";?/g, '').trim();
    // Prepend "use server";
    content = '"use server";\n' + content;
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed "use server" position in ${file}`);
  }
}
