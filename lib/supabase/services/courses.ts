"use server";

import { createClient } from "@supabase/supabase-js";
import { Course } from "@/lib/store";
import { revalidatePath } from "next/cache";

// Server-only Supabase clients. The service role key MUST stay on the server
// (no NEXT_PUBLIC_ prefix) so it is never shipped to the browser.
function getReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function uploadCourseCover(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return null;

  const supabase = getAdminClient();
  const ext = file.name.split(".").pop();
  const fileName = `course-cover-${Date.now()}.${ext}`;

  await supabase.storage.createBucket("course_covers", { public: true }).catch(() => {});

  const { error } = await supabase.storage.from("course_covers").upload(fileName, file);
  if (error) {
    console.error("Error uploading course cover:", error.message);
    return null;
  }

  const { data } = supabase.storage.from("course_covers").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function fetchCourses(type: 'course' | 'simulator' | 'all' = 'course'): Promise<Course[]> {
  console.log("SERVER ACTION: fetchCourses called with type:", type);
  const supabase = getReadClient();
  
  let query = supabase
    .from("courses")
    .select(`
      *,
      tracks (
        lessons (
          duration_seconds
        ),
        sections (
          lessons (
            duration_seconds
          )
        )
      )
    `);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("SERVER ACTION Error fetching courses:", error.message);
    return [];
  }

  const allCourses = (data || []).map((d: any) => {
    let meta: any = {};
    let realDescription = d.description || "";
    try {
      if (d.description && d.description.startsWith("{")) {
        meta = JSON.parse(d.description);
        realDescription = meta.description || "";
      }
    } catch {
      // Not JSON, ignore
    }
    
    let totalSeconds = 0;
    if (d.tracks && Array.isArray(d.tracks)) {
      d.tracks.forEach((track: any) => {
        // Sum lessons directly under tracks
        if (track.lessons && Array.isArray(track.lessons)) {
          track.lessons.forEach((lesson: any) => {
            totalSeconds += (lesson.duration_seconds || 0);
          });
        }
        // Sum lessons under sections
        if (track.sections && Array.isArray(track.sections)) {
          track.sections.forEach((section: any) => {
            if (section.lessons && Array.isArray(section.lessons)) {
              section.lessons.forEach((lesson: any) => {
                totalSeconds += (lesson.duration_seconds || 0);
              });
            }
          });
        }
      });
    }

    let totalHoursStr = "لم تُحدد بعد";
    if (totalSeconds >= 60) {
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      if (hrs > 0 && mins > 0) totalHoursStr = `${hrs} ساعة و ${mins} دقيقة`;
      else if (hrs > 0) totalHoursStr = `${hrs} ساعة`;
      else totalHoursStr = `${mins} دقيقة`;
    } else if (totalSeconds > 0) {
      totalHoursStr = "أقل من دقيقة";
    }

    return {
      id: d.id,
      title: d.title,
      subtitle: d.subtitle || "",
      description: realDescription,
      price: d.price,
      discountedPrice: d.discounted_price,
      currency: meta.currency || "ر.س",
      coverGradient: meta.coverGradient || "from-amber-500 to-orange-600",
      coverImageUrl: meta.coverImageUrl || "",
      examDate: d.exam_date || "",
      trackIds: Array.isArray(meta.trackIds) ? meta.trackIds : [],
      features: Array.isArray(meta.features) ? meta.features : [],
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      instructorName: meta.instructorName || "",
      // الأولوية للحساب الفعلي من الدروس — meta.totalHours احتياطي فقط إذا لم توجد دروس
      totalHours: (totalSeconds > 0 ? totalHoursStr : null) || meta.totalHours || totalHoursStr,
      studentsCount: meta.studentsCount ?? 0,
      isActive: d.is_active,
      isFeatured: d.is_featured,
      requireWhatsappActivation: meta.requireWhatsappActivation ?? true, // Default to true if not set
      featuresOverride: d.features_override || {},
      isSimulator: meta.isSimulator || false,
      createdAt: d.created_at,
    };
  });

  console.log("SERVER ACTION: fetchCourses returned data length:", allCourses.length);

  if (type === 'course') {
    return allCourses.filter(c => !c.isSimulator);
  } else if (type === 'simulator') {
    return allCourses.filter(c => c.isSimulator);
  }
  return allCourses;
}

export async function createCourse(course: Partial<Course>): Promise<Course | null> {
  const supabase = getAdminClient();

  const metadata = {
    description: course.description,
    currency: course.currency,
    coverGradient: course.coverGradient,
    coverImageUrl: course.coverImageUrl,
    trackIds: course.trackIds,
    features: course.features,
    tags: course.tags,
    instructorName: course.instructorName || "",
    totalHours: course.totalHours,
    studentsCount: course.studentsCount || 0,
    requireWhatsappActivation: course.requireWhatsappActivation ?? true,
    isSimulator: course.isSimulator ?? false,
  };

  const { data, error } = await supabase
    .from("courses")
    .insert([
      {
        title: course.title,
        subtitle: course.subtitle,
        description: JSON.stringify(metadata),
        price: course.price,
        discounted_price: course.discountedPrice,
        is_active: course.isActive,
        is_featured: course.isFeatured,
        exam_date: course.examDate || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating course:", error.message);
    return null;
  }

  revalidatePath("/", "layout");

  return {
    ...course,
    id: data.id,
    createdAt: data.created_at,
  } as Course;
}

export async function updateCourse(id: string, course: Partial<Course>): Promise<boolean> {
  const supabase = getAdminClient();

  // Fetch the existing course to merge metadata
  const { data: existing } = await supabase.from("courses").select("description").eq("id", id).single();
  let meta: any = {};
  if (existing?.description && existing.description.startsWith("{")) {
    try { meta = JSON.parse(existing.description); } catch {}
  }

  if (course.description !== undefined) meta.description = course.description;
  if (course.currency !== undefined) meta.currency = course.currency;
  if (course.coverGradient !== undefined) meta.coverGradient = course.coverGradient;
  if (course.coverImageUrl !== undefined) meta.coverImageUrl = course.coverImageUrl;
  if (course.trackIds !== undefined) meta.trackIds = course.trackIds;
  if (course.features !== undefined) meta.features = course.features;
  if (course.tags !== undefined) meta.tags = course.tags;
  if (course.instructorName !== undefined) meta.instructorName = course.instructorName;
  if (course.totalHours !== undefined) meta.totalHours = course.totalHours;
  if (course.studentsCount !== undefined) meta.studentsCount = course.studentsCount;
  if (course.requireWhatsappActivation !== undefined) meta.requireWhatsappActivation = course.requireWhatsappActivation;
  if (course.isSimulator !== undefined) meta.isSimulator = course.isSimulator;

  const payload: Record<string, any> = {};
  if (course.title !== undefined) payload.title = course.title;
  if (course.subtitle !== undefined) payload.subtitle = course.subtitle;
  if (course.price !== undefined) payload.price = course.price;
  if (course.discountedPrice !== undefined) payload.discounted_price = course.discountedPrice;
  if (course.isActive !== undefined) payload.is_active = course.isActive;
  if (course.isFeatured !== undefined) payload.is_featured = course.isFeatured;
  if (course.examDate !== undefined) payload.exam_date = course.examDate || null;

  // Always update description to include merged metadata
  payload.description = JSON.stringify(meta);

  const { error } = await supabase
    .from("courses")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("Error updating course:", error.message);
    return false;
  }
  
  revalidatePath("/", "layout");
  return true;
}

export async function deleteCourse(id: string): Promise<boolean> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting course:", error.message);
    return false;
  }
  
  revalidatePath("/", "layout");
  return true;
}

export async function uploadCourseCoverImage(formData: FormData): Promise<string | null> {
  console.warn("uploadCourseCoverImage not implemented");
  return null;
}
