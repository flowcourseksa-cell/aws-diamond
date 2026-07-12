async function run() {
  const res = await fetch('https://tdzzsmwvmddhypaoequv.supabase.co/rest/v1/tracks?select=*', {
    headers: {
      apikey: 'sb_publishable_gJy5VpH6lIEjeGT56ootVw_fSo8tjrT',
      Authorization: 'Bearer sb_publishable_gJy5VpH6lIEjeGT56ootVw_fSo8tjrT'
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
