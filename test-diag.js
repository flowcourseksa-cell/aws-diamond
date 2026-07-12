const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
  }
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  // 1. Get all courses
  const { data: courses } = await supabase.from('courses').select('id, title');
  console.log('All courses:', JSON.stringify(courses));

  // 2. Get all enrollments
  const { data: enrollments } = await supabase.from('enrollments').select('student_id, course_id, is_active').limit(10);
  console.log('\nEnrollments (first 10):', JSON.stringify(enrollments));

  // 3. Get all tracks per course
  for (const c of (courses || [])) {
    const { data: tracks } = await supabase.from('tracks').select('id, name, course_id').eq('course_id', c.id);
    console.log(`\nCourse "${c.title}" (${c.id}) tracks:`, JSON.stringify(tracks));
  }
}
test();
