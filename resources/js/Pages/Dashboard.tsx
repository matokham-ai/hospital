import HMSLayout from '@/Layouts/HMSLayout';
import { Head, Link } from '@inertiajs/react';
import TestModal from '@/Components/TestModal';
import { PremiumCard, PremiumBadge, PremiumButton } from '@/Components/Premium';
import { useState } from 'react';

export default function Dashboard({
    userRole,
    userName,
    userEmail,
    auth
}: {
    userRole?: string;
    userName?: string;
    userEmail?: string;
    auth?: { user: { name: string; email: string; role?: string } };
}) {
    const getRoleInfo = (role: string) => {
        const roles = {
            'Admin': { name: 'Administrator', icon: '⚙️', color: 'red' },
            'Doctor': { name: 'Doctor', icon: '👨‍⚕️', color: 'blue' },
            'Nurse': { name: 'Nurse', icon: '👩‍⚕️', color: 'green' },
            'Lab Technician': { name: 'Lab Technician', icon: '🔬', color: 'purple' },
            'Pharmacist': { name: 'Pharmacist', icon: '💊', color: 'orange' },
            'Receptionist': { name: 'Receptionist', icon: '📋', color: 'pink' },
            'Cashier': { name: 'Cashier', icon: '💰', color: 'yellow' },
            'Radiologist': { name: 'Radiologist', icon: '🩻', color: 'indigo' },
        };
        return roles[role as keyof typeof roles] || { name: 'User', icon: '👤', color: 'gray' };
    };

    const roleInfo = userRole ? getRoleInfo(userRole) : { name: 'User', icon: '👤', color: 'gray' };
    const [testModalOpen, setTestModalOpen] = useState(false);

    const user = auth?.user || { name: userName || 'User', email: userEmail || '', role: userRole };

    return (
        <HMSLayout user={user}>
            <Head title="Dashboard - MediCare HMS" />

            <div className="space-y-8">
                {/* Welcome Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                            Welcome back, {userName}!
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-2">
                            <span className="text-2xl">{roleInfo.icon}</span>
                            {roleInfo.name} Dashboard
                        </p>
                    </div>
                    <PremiumBadge 
                        variant={roleInfo.color === 'red' ? 'danger' : roleInfo.color === 'blue' ? 'info' : 'success'}
                        size="lg"
                    >
                        {roleInfo.name}
                    </PremiumBadge>
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* User Profile Card */}
                    <PremiumCard variant="feature">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                                {roleInfo.icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                    {userName}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {userEmail}
                                </p>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200/50 dark:border-teal-700/50">
                            <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
                                Active Role: <strong>{roleInfo.name}</strong>
                            </p>
                        </div>
                    </PremiumCard>

                    {/* Quick Actions Card */}
                    <PremiumCard variant="feature">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            ⚡ Quick Actions
                        </h3>
                        <div className="space-y-3">
                            <Link 
                                href={route('admin.dashboard')} 
                                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-300 group"
                            >
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    📊
                                </div>
                                <span className="font-medium text-slate-700 dark:text-slate-300">View Reports</span>
                            </Link>
                            <Link 
                                href={route('web.patients.index')} 
                                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30 transition-all duration-300 group"
                            >
                                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    👥
                                </div>
                                <span className="font-medium text-slate-700 dark:text-slate-300">Manage Patients</span>
                            </Link>
                            <Link 
                                href={route('web.appointments.index')} 
                                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all duration-300 group"
                            >
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    📅
                                </div>
                                <span className="font-medium text-slate-700 dark:text-slate-300">Schedule Appointments</span>
                            </Link>
                        </div>
                    </PremiumCard>

                    {/* System Status Card */}
                    <PremiumCard variant="feature">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            🔧 System Status
                        </h3>
                        <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg"></div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">System Online</span>
                                <PremiumBadge variant="success" size="sm">Active</PremiumBadge>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg"></div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Database Connected</span>
                                <PremiumBadge variant="success" size="sm">OK</PremiumBadge>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-lg"></div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Backup Scheduled</span>
                                <PremiumBadge variant="warning" size="sm">Pending</PremiumBadge>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-200/50 dark:border-slate-600/50">
                            <PremiumButton 
                                variant="secondary" 
                                onClick={() => setTestModalOpen(true)}
                                className="w-full"
                            >
                                🧪 Test Modal
                            </PremiumButton>
                            <TestModal 
                                isOpen={testModalOpen} 
                                onClose={() => setTestModalOpen(false)}
                            >
                                <p className="text-slate-600">This is a test modal for system diagnostics.</p>
                            </TestModal>
                        </div>
                    </PremiumCard>
                </div>

                {/* Additional Dashboard Content */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Activity */}
                    <PremiumCard variant="feature">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                            📈 Recent Activity
                        </h3>
                        <div className="space-y-3">
                            {[
                                { action: 'Patient registered', time: '5 minutes ago', type: 'success' },
                                { action: 'Appointment scheduled', time: '15 minutes ago', type: 'info' },
                                { action: 'Lab report generated', time: '1 hour ago', type: 'warning' },
                            ].map((activity, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-white/50 to-white/30 dark:from-slate-800/50 dark:to-slate-700/30 backdrop-blur-sm border border-white/20 dark:border-slate-600/20">
                                    <div className={`w-2 h-2 rounded-full ${
                                        activity.type === 'success' ? 'bg-green-500' :
                                        activity.type === 'info' ? 'bg-blue-500' : 'bg-yellow-500'
                                    }`}></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-800 dark:text-white">{activity.action}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </PremiumCard>

                    {/* Quick Stats */}
                    <PremiumCard variant="feature">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                            📊 Quick Stats
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">247</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">Total Patients</div>
                            </div>
                            <div className="text-center p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">89%</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">Bed Occupancy</div>
                            </div>
                            <div className="text-center p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">23</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">Appointments</div>
                            </div>
                            <div className="text-center p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">12</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">Pending Labs</div>
                            </div>
                        </div>
                    </PremiumCard>
                </div>
            </div>
        </HMSLayout>
    );
}
