import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '');
  });
}

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase credentials in env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking Supabase Schema and Data...");
  
  const tablesToCheck = [
    'profiles', 'courses', 'lessons', 'exams', 'files', 'interactive_books', 
    'notifications', 'enrollments', 'discount_codes', 'platform_settings', 
    'skill_progress', 'lesson_progress', 'exam_attempts'
  ];

  const report = {};

  for (const table of tablesToCheck) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      report[table] = { status: 'Missing or Error', message: error.message };
    } else {
      report[table] = { status: 'Exists', rowCount: count };
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

checkSchema();
