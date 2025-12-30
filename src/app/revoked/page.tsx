'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LogOut, ShieldAlert, Mail } from 'lucide-react';
import Link from 'next/link';

export default function RevokedPage() {
    const { signOut } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-red-600">
                    <ShieldAlert className="h-16 w-16" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-sans">
                    Account Revoked
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 font-sans">
                    Your access to the learning portal has been suspended.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-red-100">
                    <div className="space-y-6">
                        <div className="text-gray-700 space-y-4">
                            <p className="text-bold font-bold text-black border-l-4 border-red-500 pl-4 py-2 bg-red-50 rounded-r-md">
                                Possible Reason: Missed Assignment Deadline
                            </p>
                            <p className="text-sm">
                                Our system detected that one or more assignments were not submitted before the deadline. Per the program policy, access is automatically revoked in such cases.
                            </p>
                            <p className="text-sm font-medium">
                                To restore your access:
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-2 text-gray-600">
                                <li>Contact administrator: <span className="font-bold text-gray-900">mraayush979@gmail.com</span></li>
                                <li>Provide your full name and number.</li>
                                <li>The administrator will review your situation and can manually restore your account.</li>
                            </ul>
                        </div>

                        <div className="flex flex-col space-y-3">
                            <a
                                href="mailto:mraayush979@gmail.com"
                                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all font-sans"
                            >
                                <Mail className="mr-2 h-4 w-4" /> Contact Admin
                            </a>
                            <p className="text-[10px] text-center text-gray-400 font-mono">mraayush979@gmail.com</p>
                            <button
                                onClick={async () => {
                                    await signOut();
                                    window.location.href = '/login';
                                }}
                                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all font-sans"
                            >
                                <LogOut className="mr-2 h-4 w-4" /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
