import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { PremiumCard, PremiumButton, PremiumBadge } from '@/Components/Premium';

interface User {
  name: string;
  email: string;
  role?: string;
}

interface LayoutTestProps {
  user?: User;
}

export default function LayoutTest({ user }: LayoutTestProps) {
  const testUser = user || { 
    name: 'Test User', 
    email: 'test@example.com', 
    role: 'Doctor' 
  };

  return (
    <HMSLayout user={testUser}>
      <Head title="Layout Test" />
      
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Premium Layout Test
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
            Testing the premium HMS layout features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PremiumCard variant="feature">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              Glass Morphism Card
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              This card demonstrates the glass morphism effect with backdrop blur.
            </p>
            <PremiumBadge variant="success">
              Working ✓
            </PremiumBadge>
          </PremiumCard>

          <PremiumCard variant="default">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              Premium Components
            </h3>
            <div className="space-y-3">
              <PremiumButton variant="primary" className="w-full">
                Primary Button
              </PremiumButton>
              <PremiumButton variant="secondary" className="w-full">
                Secondary Button
              </PremiumButton>
            </div>
          </PremiumCard>

          <PremiumCard variant="compact">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">
              Status Badges
            </h3>
            <div className="space-y-2">
              <div><PremiumBadge variant="success">Success</PremiumBadge></div>
              <div><PremiumBadge variant="warning">Warning</PremiumBadge></div>
              <div><PremiumBadge variant="danger">Critical</PremiumBadge></div>
              <div><PremiumBadge variant="info">Info</PremiumBadge></div>
            </div>
          </PremiumCard>
        </div>

        <PremiumCard variant="feature">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
            Layout Features Test
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
                ✅ Working Features
              </h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li>• Glass morphism sidebar</li>
                <li>• Premium navbar with search</li>
                <li>• Dark mode toggle</li>
                <li>• Animated notifications</li>
                <li>• Gradient backgrounds</li>
                <li>• Framer Motion animations</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
                🎨 Design Elements
              </h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li>• Backdrop blur effects</li>
                <li>• Smooth gradients</li>
                <li>• Premium shadows</li>
                <li>• Medical color coding</li>
                <li>• Professional typography</li>
                <li>• Hospital-grade interface</li>
                <li>• Accessibility compliant</li>
              </ul>
            </div>
          </div>
        </PremiumCard>
      </div>
    </HMSLayout>
  );
}