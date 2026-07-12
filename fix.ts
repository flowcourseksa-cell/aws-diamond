import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const meta = {
    features: ['200+ درس مصور', '3000+ سؤال تدريبي', 'شرح المهارات الضعيفة'],
    description: 'لاختبارات الكمي واللفظي',
  };
  const { error } = await supabase.from('courses').update({
    title: 'الدوره المدفوعة',
    description: JSON.stringify(meta)
  }).eq('id', '47aa95cf-b6e1-40fc-933e-d3a17d8232bf');
  
  if (error) console.error(error);
  else console.log("Database restored successfully!");
}

run();
