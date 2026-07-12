const fs = require('fs');

function replaceColors(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/indigo/g, 'orange');
  content = content.replace(/purple/g, 'amber');
  content = content.replace(/violet/g, 'yellow');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Replaced colors in ${filePath}`);
}

replaceColors('f:/TKHSAS/app/simulator/[courseId]/page.tsx');
replaceColors('f:/TKHSAS/app/simulator-app/[courseId]/simulator-client.tsx');
