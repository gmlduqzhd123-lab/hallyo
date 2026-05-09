require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await sb.from('schedules').select('id, location, title').eq('type', 'competition').limit(3);
  console.log('Original', data);
  if(data && data.length > 0) {
     const res = await sb.from('schedules').update({ location: data[0].location + ' 테스트' }).eq('id', data[0].id).select();
     console.log('Update result', res.data, res.error);
  }
}
test();
