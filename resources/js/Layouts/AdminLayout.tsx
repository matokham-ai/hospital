import React from 'react';
import HMSLayout from './HMSLayout';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: User;
  breadcrumbs?: Array<{ name: string; href?: string }>;
}

/**
 * AdminLayout - Forces admin navigation context
 * This layout ensures that admin pages always show the admin navigation
 * regardless of the user's actual role in the database
 */
export default function AdminLayout({ children, user, breadcrumbs }: AdminLayoutProps) {
  // Force admin role for navigation purposes
  const adminUser = user ? { ...user, role: 'Admin' } : undefined;

  return (
    <HMSLayout user={adminUser} breadcrumbs={breadcrumbs}>
      {children}
    </HMSLayout>
  );
}