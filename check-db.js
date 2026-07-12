const sbUrl = 'https://tdzzsmwvmddhypaoequv.supabase.co';
const sbKey = 'sb_secret_J3WNFRc4MGjlAPa_sz1ypA_lQSiCg2w';
async function run() {
  const r1 = await fetch(sbUrl + '/rest/v1/profiles?role=eq.student&select=id', { headers: { apikey: sbKey, Authorization: 'Bearer ' + sbKey }});
  const students = await r1.json();
  console.log('Total DB Students:', students.length);
  
  const r2 = await fetch(sbUrl + '/rest/v1/courses?select=id', { headers: { apikey: sbKey, Authorization: 'Bearer ' + sbKey }});
  const courses = await r2.json();
  console.log('Total DB Courses:', courses.length);

  const r3 = await fetch(sbUrl + '/rest/v1/exams?select=id', { headers: { apikey: sbKey, Authorization: 'Bearer ' + sbKey }});
  const exams = await r3.json();
  console.log('Total DB Exams:', exams.length);

  const r4 = await fetch(sbUrl + '/rest/v1/lessons?select=id', { headers: { apikey: sbKey, Authorization: 'Bearer ' + sbKey }});
  const lessons = await r4.json();
  console.log('Total DB Lessons:', lessons.length);
}
run();
