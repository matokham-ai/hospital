import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';

interface Role {
    id: string;
    name: string;
    description: string;
    icon: string;
}

interface LoginProps {
    status?: string;
    roles: Role[];
}

export default function Login({ status, roles }: LoginProps) {
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        role: '',
        remember: false,
    });

    // Auto-focus email field on mount
    useEffect(() => {
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.focus();
        }
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        if (!selectedRole) {
            return;
        }

        setIsLoading(true);
        
        post(route('login'), {
            onFinish: () => {
                reset('password');
                setIsLoading(false);
            },
            onError: () => {
                setIsLoading(false);
            }
        });
    };

    const handleRoleSelect = (roleId: string) => {
        setSelectedRole(roleId);
        setData('role', roleId);
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Head title="MediCare HMS - Secure Login" />
            
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            
            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-gradient-to-br from-teal-500 to-blue-600 p-3 rounded-2xl mr-4">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                                MediCare HMS
                            </h1>
                            <p className="text-gray-600 text-lg mt-1 font-medium">Hospital Management System</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-4 border border-teal-100">
                        <p className="text-gray-700 font-medium">Welcome back! Please select your role and sign in</p>
                        <p className="text-gray-500 text-sm mt-1">Secure access to your healthcare workspace</p>
                    </div>
                </div>

                {status && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-medium text-emerald-700 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-8">
                    {/* Role Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Choose Your Role</h3>
                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {roles.length} roles available
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => handleRoleSelect(role.id)}
                                    className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left hover:shadow-lg hover:scale-105 ${
                                        selectedRole === role.id
                                            ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-blue-50 shadow-lg scale-105'
                                            : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-teal-50'
                                    }`}
                                >
                                    {selectedRole === role.id && (
                                        <div className="absolute -top-2 -right-2 bg-teal-500 text-white rounded-full p-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">{role.icon}</div>
                                    <h4 className="font-bold text-gray-800 text-base mb-1">{role.name}</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">{role.description}</p>
                                </button>
                            ))}
                        </div>
                        
                        {errors.role && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Please select a role to continue
                            </div>
                        )}
                    </div>

                    {/* Credentials Section */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-3">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                                    placeholder="your.email@hospital.com"
                                    autoComplete="email"
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                            </div>
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-3">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <TextInput
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-2" />
                        </div>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center">
                        <input
                            id="remember"
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                        />
                        <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                            Keep me signed in for 30 days
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing || isLoading || !selectedRole || !data.email || !data.password}
                        className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-teal-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                        {(processing || isLoading) ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Signing In...</span>
                            </>
                        ) : (
                            <>
                                <span>Access Dashboard</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </>
                        )}
                    </button>



                    {/* Security Notice & Support */}
                    <div className="text-center text-xs text-gray-500 bg-gray-50 p-4 rounded-xl border">
                        <div className="flex items-center justify-center mb-2">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="font-medium">Secure Connection</span>
                        </div>
                        <p>Your login credentials are encrypted and secure.</p>
                        <p className="mt-1">Contact your system administrator for account access or technical support.</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
