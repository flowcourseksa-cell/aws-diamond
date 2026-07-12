import { createClient } from '@supabase/supabase-js';
import { FLOW_TRACKS, TRACK_EXAMS, LESSONS, LIBRARY_FILES } from '../lib/mock-data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Fetching comprehensive course ID...');
  const { data: courses, error: fetchCourseError } = await supabase.from('courses').select('id').limit(1);
  
  if (fetchCourseError || !courses || courses.length === 0) {
    console.error('Error fetching course:', fetchCourseError);
    return;
  }
  
  const courseId = courses[0].id;
  console.log('Course ID:', courseId);

  console.log('Clearing old hierarchy...');
  await supabase.from('tracks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // Maps for foreign keys
  const trackMap = new Map<string, string>(); // oldId -> newId
  const sectionMap = new Map<string, string>(); // oldId -> newId
  const skillMap = new Map<string, string>(); // oldId -> newId

  console.log('Seeding tracks, sections, and skills...');
  for (let i = 0; i < FLOW_TRACKS.length; i++) {
    const track = FLOW_TRACKS[i];
    
    // 1. Insert Track
    const { data: dbTrack, error: trackErr } = await supabase.from('tracks').insert({
      course_id: courseId,
      name: track.name,
      icon: track.icon,
      color: track.color,
      order_index: i
    }).select('id').single();

    if (trackErr) {
      console.error('Error inserting track:', track.name, trackErr);
      continue;
    }
    trackMap.set(track.id, dbTrack.id);

    // 2. Insert Sections
    for (let j = 0; j < track.sections.length; j++) {
      const section = track.sections[j];
      const { data: dbSection, error: sectionErr } = await supabase.from('sections').insert({
        track_id: dbTrack.id,
        name: section.name,
        order_index: j
      }).select('id').single();

      if (sectionErr) {
        console.error('Error inserting section:', section.name, sectionErr);
        continue;
      }
      sectionMap.set(section.id, dbSection.id);

      // 3. Insert Skills
      for (const skill of section.skills) {
        const { data: dbSkill, error: skillErr } = await supabase.from('micro_skills').insert({
          section_id: dbSection.id,
          name: skill.name,
          description: skill.name, // using name as description
        }).select('id').single();

        if (skillErr) {
          console.error('Error inserting skill:', skill.name, skillErr);
          continue;
        }
        skillMap.set(skill.id, dbSkill.id);
      }
    }
  }

  console.log('Seeding exams and questions...');
  for (const exam of TRACK_EXAMS) {
    const newTrackId = trackMap.get(exam.trackId);
    const newSectionId = sectionMap.get(exam.sectionId);
    
    if (!newTrackId) continue;

    const { data: dbExam, error: examErr } = await supabase.from('exams').insert({
      track_id: newTrackId,
      section_id: newSectionId || null,
      title: exam.name,
      time_limit_seconds: exam.timeMinutes * 60,
      access_type: exam.accessType,
      is_published: true
    }).select('id').single();

    if (examErr) {
      console.error('Error inserting exam:', exam.name, examErr);
      continue;
    }

    // Insert Questions
    for (const q of exam.questions) {
      const newSkillId = skillMap.get(q.skillId);
      if (!newSkillId) {
        console.warn('Skipping question because skill not found:', q.skillId);
        continue; // Critical mapping
      }

      const { data: qData, error: qErr } = await supabase.from('questions').insert({
        exam_id: dbExam.id,
        micro_skill_id: newSkillId,
        text: q.questionText,
        explanation: q.explanation || null,
        difficulty: 'medium', // Default
      }).select('id').single();

      if (qErr) {
        console.error('Error inserting question:', qErr);
        continue;
      }

      // Insert Options
      for (let k = 0; k < q.options.length; k++) {
        const isCorrect = (k === q.correctIndex);
        const { error: optErr } = await supabase.from('question_options').insert({
          question_id: qData.id,
          text: q.options[k],
          is_correct: isCorrect
        });
        if (optErr) {
          console.error('Error inserting option:', optErr);
        }
      }
    }
  }

  console.log('Seeding lessons...');
  for (const lesson of LESSONS) {
    const { error: lErr } = await supabase.from('lessons').insert({
      track_id: trackMap.values().next().value, // Since LESSONS use generic ids, just attach to first track
      title: lesson.title,
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Dummy
      teacher_name: lesson.teacherName,
      duration_seconds: parseInt(lesson.durationLabel.split(':')[0]) * 60,
      access_type: lesson.accessType,
      price: lesson.price,
      status: 'normal'
    });
    if (lErr) console.error('Error inserting lesson:', lErr);
  }

  console.log('Seeding library files...');
  for (const file of LIBRARY_FILES) {
    const { error: fErr } = await supabase.from('library_files').insert({
      track_id: trackMap.values().next().value, // Just attach to first track
      title: file.title,
      file_url: 'https://example.com/dummy.pdf', // Dummy
      file_type: file.type === 'summary' ? 'pdf' : file.type,
      access_type: file.accessType
    });
    if (fErr) console.error('Error inserting file:', fErr);
  }

  console.log('Database Seeding Completed Successfully!');
}

seed();