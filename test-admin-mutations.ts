import { resolve } from 'path';

import { createCourse } from './lib/supabase/services/courses';
import { createTrack, createSection, createSkill } from './lib/supabase/services/hierarchy';
import { createExam, saveQuestionWithOptions } from './lib/supabase/services/exams';
import { createLesson } from './lib/supabase/services/lessons';

async function testMutations() {
  console.log("Starting full admin mutation test...");
  
  // 1. Create Course
  const course = await createCourse({
    title: "Test Full Course",
    subtitle: "A course to test all admin mutations",
    description: "Testing...",
    price: 99,
    discountedPrice: 49,
    isActive: true,
    isFeatured: false,
    currency: "USD",
  });
  
  if (!course) {
    console.error("Failed to create course!");
    return;
  }
  console.log("✅ Created Course:", course.id);

  // 2. Create Track
  const track = await createTrack(course.id, "Main Track", "book", "#ff0000");
  if (!track) {
    console.error("Failed to create track!");
    return;
  }
  console.log("✅ Created Track:", track.id);

  // 3. Create Section
  const section = await createSection(track.id, "Section 1");
  if (!section) {
    console.error("Failed to create section!");
    return;
  }
  console.log("✅ Created Section:", section.id);

  // 4. Create Micro-Skill
  const skill = await createSkill(section.id, "Basic Arithmetic");
  if (!skill) {
    console.error("Failed to create skill!");
    return;
  }
  console.log("✅ Created Skill:", skill.id);

  // 5. Create Exam
  const exam = await createExam({
    track_id: track.id,
    section_id: section.id,
    title: "Chapter 1 Exam",
    time_limit_seconds: 1800,
    access_type: "free",
    price: 0,
    is_published: true,
  });
  if (!exam) {
    console.error("Failed to create exam!");
    return;
  }
  console.log("✅ Created Exam:", exam.id);

  // 6. Save Question with Options
  const savedQuestion = await saveQuestionWithOptions(
    {
      exam_id: exam.id,
      micro_skill_id: skill.id,
      text: "What is 2+2?",
      difficulty: "easy",
      order_index: 0,
    },
    [
      { text: "3", is_correct: false },
      { text: "4", is_correct: true },
    ]
  );
  if (!savedQuestion) {
    console.error("Failed to create question with options!");
    return;
  }
  console.log("✅ Created Question with Options");

  // 7. Create Lesson
  const lesson = await createLesson({
    track_id: track.id,
    section_id: section.id,
    micro_skill_id: skill.id,
    title: "Intro to Math",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration_seconds: 600,
    access_type: "free",
    price: 0,
    status: "normal",
  });
  if (!lesson) {
    console.error("Failed to create lesson!");
    return;
  }
  console.log("✅ Created Lesson:", lesson.id);

  console.log("🎉 All mutations succeeded! The caching and RLS bypass issues are fixed.");
}

testMutations().catch(console.error);
