const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// For admin we need service role, but we might be able to query phase_extensions if RLS is off?
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAdminKey || supabaseKey);

async function run() {
    console.log("Checking phase_extensions...");
    const { data: extensions, error: extErr } = await supabase.from('phase_extensions').select('*');
    if (extErr) console.error("Error extensions:", extErr.message);
    else console.log("Extensions:", extensions);

    console.log("\nChecking users...");
    const { data: users, error: uErr } = await supabase.from('users').select('id, email, status, role');
    if (uErr) console.error("Error users:", uErr.message);
    else console.log("Users:", users);
    
    console.log("\nChecking phases...");
    const { data: phases, error: pErr } = await supabase.from('phases').select('id, title, end_date, is_active, is_mandatory');
    if (pErr) console.error("Error phases:", pErr.message);
    else console.log("Phases:", phases);
}

run();
