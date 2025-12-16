import { useState } from 'react';
import { motion } from 'framer-motion';
import HMSLayout from '@/Layouts/HMSLayout';
import { 
  PremiumCard, 
  PremiumButton, 
  PremiumBadge, 
  PremiumInput, 
  PremiumModal 
} from '@/Components/Premium';
import { 
  Activity, 
  Users, 
  Bed, 
  Heart, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter
} from 'lucide-react';

interface User {
  name: string;
  email: string;
  role?: string;
}

interface PremiumDemoProps {
  user?: User;
}

export default function PremiumDemo({ user }: PremiumDemoProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    {
      title: 'Total Patients',
      value: '1,247',
      change: '+12%',
      trend: 'up',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Bed Occupancy',
      value: '89%',
      change: '+5%',
      trend: 'up',
      icon: Bed,
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Critical Cases',
      value: '23',
      change: '-8%',
      trend: 'down',
      icon: Heart,
      gradient: 'from-red-500 to-pink-500'
    },
    {
      title: 'Revenue',
      value: '$847K',
      change: '+18%',
      trend: 'up',
      icon: TrendingUp,
      gradient: 'from-purple-500 to-indigo-500'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'admission',
      message: 'New patient admitted to ICU',
      time: '5 minutes ago',
      status: 'critical'
    },
    {
      id: 2,
      type: 'discharge',
      message: 'Patient John Doe discharged successfully',
      time: '15 minutes ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'lab',
      message: 'Lab results pending for Room 205',
      time: '30 minutes ago',
      status: 'warning'
    },
    {
      id: 4,
      type: 'medication',
      message: 'Medication administered to Room 301',
      time: '1 hour ago',
      status: 'info'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <HMSLayout user={user}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Premium Dashboard
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
              Experience the next generation of hospital management
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <PremiumInput
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
              variant="glass"
              className="w-64"
            />
            <PremiumButton
              icon={Filter}
              variant="secondary"
            >
              Filter
            </PremiumButton>
            <PremiumButton
              icon={Plus}
              onClick={() => setModalOpen(true)}
            >
              New Patient
            </PremiumButton>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <PremiumCard key={stat.title} variant="glass" className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <PremiumBadge
                        variant={stat.trend === 'up' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {stat.change}
                      </PremiumBadge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        vs last month
                      </span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                {/* Animated background */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                  className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${stat.gradient} rounded-full blur-3xl`}
                />
              </PremiumCard>
            );
          })}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <PremiumCard variant="feature">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  Recent Activities
                </h2>
                <PremiumBadge variant="outline">
                  Live Updates
                </PremiumBadge>
              </div>
              
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-white/50 to-white/30 dark:from-slate-800/50 dark:to-slate-700/30 backdrop-blur-sm border border-white/20 dark:border-slate-600/20 hover:shadow-lg transition-all duration-300"
                  >
                    <div className={`p-2 rounded-xl ${
                      activity.status === 'critical' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                      activity.status === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                      activity.status === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      'bg-gradient-to-r from-blue-500 to-indigo-500'
                    } shadow-lg`}>
                      {activity.status === 'critical' && <AlertTriangle className="w-5 h-5 text-white" />}
                      {activity.status === 'success' && <CheckCircle className="w-5 h-5 text-white" />}
                      {activity.status === 'warning' && <Clock className="w-5 h-5 text-white" />}
                      {activity.status === 'info' && <Activity className="w-5 h-5 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 dark:text-white">
                        {activity.message}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </PremiumCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <PremiumCard variant="feature">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                Quick Actions
              </h2>
              
              <div className="space-y-4">
                <PremiumButton
                  variant="gradient"
                  gradient="from-blue-500 to-cyan-500"
                  className="w-full justify-start"
                  icon={Users}
                >
                  Register New Patient
                </PremiumButton>
                
                <PremiumButton
                  variant="gradient"
                  gradient="from-emerald-500 to-teal-500"
                  className="w-full justify-start"
                  icon={Bed}
                >
                  Manage Bed Allocation
                </PremiumButton>
                
                <PremiumButton
                  variant="gradient"
                  gradient="from-purple-500 to-indigo-500"
                  className="w-full justify-start"
                  icon={Activity}
                >
                  View Lab Results
                </PremiumButton>
                
                <PremiumButton
                  variant="gradient"
                  gradient="from-orange-500 to-red-500"
                  className="w-full justify-start"
                  icon={Heart}
                >
                  Emergency Protocol
                </PremiumButton>
              </div>
            </PremiumCard>
          </motion.div>
        </div>

        {/* Feature Showcase */}
        <motion.div variants={itemVariants}>
          <PremiumCard variant="feature" className="text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4">
                Premium Features
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                Experience hospital management with cutting-edge design, smooth animations, and intuitive workflows
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: 'Glass Morphism', desc: 'Beautiful translucent interfaces' },
                  { title: 'Smooth Animations', desc: 'Framer Motion powered transitions' },
                  { title: 'Dark Mode', desc: 'Elegant dark theme support' }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-white/60 to-white/40 dark:from-slate-800/60 dark:to-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30"
                  >
                    <h3 className="font-bold text-slate-800 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {feature.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </PremiumCard>
        </motion.div>
      </motion.div>

      {/* Premium Modal Example */}
      <PremiumModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Patient Registration"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PremiumInput
              label="First Name"
              placeholder="Enter first name"
              variant="glass"
            />
            <PremiumInput
              label="Last Name"
              placeholder="Enter last name"
              variant="glass"
            />
          </div>
          
          <PremiumInput
            label="Email Address"
            type="email"
            placeholder="Enter email address"
            variant="glass"
          />
          
          <PremiumInput
            label="Phone Number"
            type="tel"
            placeholder="Enter phone number"
            variant="glass"
          />
          
          <div className="flex justify-end gap-4 pt-6">
            <PremiumButton
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </PremiumButton>
            <PremiumButton>
              Register Patient
            </PremiumButton>
          </div>
        </div>
      </PremiumModal>
    </HMSLayout>
  );
}
