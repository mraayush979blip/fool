import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
                    <ShieldAlert className="h-10 w-10 text-red-600" />
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Access Denied</h1>
                <p className="text-lg text-gray-600">
                    You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>
                <div className="pt-6">
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
