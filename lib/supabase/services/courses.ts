"use server";

import { createClient } from "@supabase/supabase-js";
import { Course } from "@/lib/store";

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

export async function fetchCourses(): Promise<Course[]> {
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Error fetching courses:", error.message);
    return [];
  }

  return (data || []).map((d: any) => {
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
      totalHours: meta.totalHours || "",
      studentsCount: meta.studentsCount ?? 0,
      isActive: d.is_active,
      isFeatured: d.is_featured,
      createdAt: d.created_at,
    };
  });
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
    instructorName: course.instructorName,
    totalHours: course.totalHours,
    studentsCount: course.studentsCount,
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
  return true;
}
