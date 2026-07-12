import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Clearing old courses...');
  const { error: deleteError } = await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) {
    console.error('Error clearing courses:', deleteError);
    return;
  }

  console.log('Inserting comprehensive course...');
  const { data, error } = await supabase.from('courses').insert([{
    title: 'دورة الأوس الماسية الشاملة',
    subtitle: 'تضم مسارات القدرات (كمي ولفظي)، التأسيس، التحصيلي، ونافس في مكان واحد مع تقييم ذكي لمستواك.',
    description: 'تغنيك عن أي مصادر أخرى ويمكنك الاكتفاء بها دون تشتت.',
    price: 0,
    discounted_price: 0,
    is_active: true,
    is_featured: true,
  }]).select().single();

  if (error) {
    console.error('Error inserting course:', error);
    return;
  }

  console.log('Course seeded successfully:', data.id);
}

seed();