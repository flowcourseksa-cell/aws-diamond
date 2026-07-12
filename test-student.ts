import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://tdzzsmwvmddhypaoequv.supabase.co',
  'sb_secret_J3WNFRc4MGjlAPa_sz1ypA_lQSiCg2w'
);

async function run() {
  const { data: exams, error } = await supabaseAdmin.from('exams').select('id, title, time_limit_seconds, is_published, created_at').order('created_at', { ascending: false });
  console.log("Error:", error);
  console.log("Exams in DB:", exams);

  // Also query questions to see if they were added
  const { data: questions } = await supabaseAdmin.from('questions').select('id, exam_id, text, created_at');
  console.log("Total Questions in DB:", questions?.length);
  
  // Group questions by exam
  const qByExam: Record<string, number> = {};
  for (const q of questions || []) {
    qByExam[q.exam_id] = (qByExam[q.exam_id] || 0) + 1;
  }
  console.log("Questions per exam:", qByExam);
}
run();
