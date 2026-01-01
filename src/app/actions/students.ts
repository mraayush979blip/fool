'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

interface StudentToImport {
    name: string;
    email: string;
    roll_number: string;
    phone?: string;
    password: string;
}

export async function importStudentsAction(students: StudentToImport[]) {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const student of students) {
        try {
            // 1. Create user in Supabase Auth
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: student.email,
                password: student.password,
                email_confirm: true,
                user_metadata: {
                    name: student.name,
                    role: 'student'
                }
            });

            if (authError) {
                // If user already exists in auth, try to find them or skip
                if (authError.message.includes('already has been registered')) {
                    // Check if they exist in our users table
                    const { data: existingUser } = await supabaseAdmin
                        .from('users')
                        .select('id')
                        .eq('email', student.email)
                        .single();

                    if (existingUser) {
                        throw new Error(`Student with email ${student.email} already exists in database.`);
                    } else {
                        // User exists in Auth but not in users table? 
                        // This might happen if previous import failed halfway.
                        // We can't easily get the UID without searching Auth.
                        throw new Error(`Auth account for ${student.email} already exists but no user record found.`);
                    }
                }
                throw authError;
            }

            const authId = authData.user?.id;
            if (!authId) throw new Error('Failed to get Auth ID for created user.');

            // 2. Insert into users table
            const { error: insertError } = await supabaseAdmin
                .from('users')
                .insert({
                    id: authId,
                    email: student.email,
                    name: student.name,
                    roll_number: student.roll_number,
                    phone: student.phone,
                    role: 'student',
                    status: 'active'
                });

            if (insertError) {
                // Cleanup Auth user if DB insert fails? Maybe too aggressive.
                // For now, just report the error.
                throw insertError;
            }

            successCount++;
        } catch (err: any) {
            failedCount++;
            errors.push(`${student.email}: ${err.message}`);
            console.error(`Error importing student ${student.email}:`, err);
        }
    }

    return {
        success: true,
        successCount,
        failedCount,
        errors
    };
}
