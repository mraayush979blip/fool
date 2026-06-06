const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
    const { data, error } = await supabase.rpc('debug_get_extensions', { test_uid: '18dc31b4-e983-4c50-836d-31f7bbd3ae9a' });
    console.log(error ? error : data);
}
run();
