import HMSLayout from '@/Layouts/HMSLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { PremiumCard } from '@/Components/Premium';

export default function Edit({
    mustVerifyEmail,
    status,
    auth,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <HMSLayout user={auth.user}>
            <Head title="Profile Settings" />

            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Profile Settings
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
                        Manage your account settings and preferences
                    </p>
                </div>

                <div className="grid gap-8 max-w-4xl">
                    <PremiumCard variant="feature">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                            Profile Information
                        </h2>
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </PremiumCard>

                    <PremiumCard variant="feature">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                            Update Password
                        </h2>
                        <UpdatePasswordForm className="max-w-xl" />
                    </PremiumCard>

                    <PremiumCard variant="feature">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                            Delete Account
                        </h2>
                        <DeleteUserForm className="max-w-xl" />
                    </PremiumCard>
                </div>
            </div>
        </HMSLayout>
    );
}
