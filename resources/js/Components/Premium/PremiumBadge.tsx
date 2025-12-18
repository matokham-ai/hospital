import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PremiumBadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  pulse?: boolean;
  gradient?: string;
  className?: string;
}

export default function PremiumBadge({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  pulse = false,
  gradient,
  className = ''
}: PremiumBadgeProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white',
    secondary: 'bg-gradient-to-r from-slate-500 to-gray-600 text-white',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white',
    info: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
    outline: 'border-2 border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`
        inline-flex items-center gap-2 rounded-full font-bold shadow-md
        ${gradient ? `bg-gradient-to-r ${gradient} text-white` : variants[variant]}
        ${sizes[size]}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </motion.span>
  );
}
