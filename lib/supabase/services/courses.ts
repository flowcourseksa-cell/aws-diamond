import { createClient } from "@/lib/supabase/client";
import { Course } from "@/lib/store";

export async function fetchCourses(): Promise<Course[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching courses:", error);
    return [];
  }

  // Map from DB columns to the expected Course type.
  // Only DB-backed values are used; optional arrays default to empty
  // instead of fabricated marketing data.
  return data.map((d: any) => ({
    id: d.id,
    title: d.title,
    subtitle: d.subtitle || "",
    description: d.description || "",
    price: d.price,
    discountedPrice: d.discounted_price,
    currency: d.currency || "ر.س",
    coverGradient: d.cover_gradient || "from-amber-500 to-orange-600",
    examDate: d.exam_date || "",
    trackIds: Array.isArray(d.track_ids) ? d.track_ids : [],
    features: Array.isArray(d.features) ? d.features : [],
    tags: Array.isArray(d.tags) ? d.tags : [],
    instructorName: d.instructor_name || "",
    totalHours: d.total_hours || "",
    studentsCount: d.students_count ?? 0,
    isActive: d.is_active,
    isFeatured: d.is_featured,
    createdAt: d.created_at,
  }));
}

export async function createCourse(course: Partial<Course>): Promise<Course | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert([
      {
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        price: course.price,
        discounted_price: course.discountedPrice,
        currency: course.currency,
        cover_gradient: course.coverGradient,
        track_ids: course.trackIds,
        features: course.features,
        tags: course.tags,
        instructor_name: course.instructorName,
        total_hours: course.totalHours,
        students_count: course.studentsCount,
        is_active: course.isActive,
        is_featured: course.isFeatured,
        exam_date: course.examDate || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating course:", error);
    return null;
  }

  return {
    ...course,
    id: data.id,
    createdAt: data.created_at,
  } as Course;
}

export async function updateCourse(id: string, course: Partial<Course>): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("courses")
    .update({
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      price: course.price,
      discounted_price: course.discountedPrice,
      currency: course.currency,
      cover_gradient: course.coverGradient,
      track_ids: course.trackIds,
      features: course.features,
      tags: course.tags,
      instructor_name: course.instructorName,
      total_hours: course.totalHours,
      students_count: course.studentsCount,
      is_active: course.isActive,
      is_featured: course.isFeatured,
      exam_date: course.examDate || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating course:", error);
    return false;
  }
  return true;
}

export async function deleteCourse(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting course:", error);
    return false;
  }
  return true;
}

