import HMSLayout from '@/Layouts/HMSLayout';
import { Head } from '@inertiajs/react';

interface ComingSoonProps {
    title: string;
    description: string;
    icon: string;
    userName?: string;
    userEmail?: string;
    userRole?: string;
}

export default function ComingSoon({ 
    title, 
    description, 
    icon, 
    userName, 
    userEmail, 
    userRole 
}: ComingSoonProps) {
    return (
        <HMSLayout user={{ name: userName || 'User', email: userEmail || '', role: userRole || 'User' }}>
            <Head title={`${title} - MediCare HMS`} />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-12 text-center">
                            <div className="text-6xl mb-6">{icon}</div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
                            <p className="text-lg text-gray-600 mb-8">{description}</p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                                <h3 className="text-lg font-semibold text-blue-900 mb-2">Coming Soon!</h3>
                                <p className="text-blue-700 text-sm">
                                    This feature is currently under development. We're working hard to bring you 
                                    the best hospital management experience.
                                </p>
                            </div>
                            <div className="mt-8">
                                <button 
                                    onClick={() => window.history.back()}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    ← Go Back
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}