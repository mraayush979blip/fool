import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { students } = body;

        if (!students || !Array.isArray(students)) {
            return NextResponse.json({ success: false, error: 'Invalid students data' }, { status: 400 });
        }

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
                    if (authError.message.includes('already has been registered')) {
                        const { data: existingUser } = await supabaseAdmin
                            .from('users')
                            .select('id')
                            .eq('email', student.email)
                            .single();

                        if (existingUser) {
                            throw new Error(`Student with email ${student.email} already exists in database.`);
                        } else {
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
                    throw insertError;
                }

                successCount++;
            } catch (err: any) {
                failedCount++;
                errors.push(`${student.email}: ${err.message}`);
                console.error(`Error importing student ${student.email}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            successCount,
            failedCount,
            errors
        });

    } catch (error: any) {
        console.error('API Import error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
