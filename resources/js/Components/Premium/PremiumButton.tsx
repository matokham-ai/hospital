import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PremiumButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  gradient?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export default function PremiumButton({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  gradient,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button'
}: PremiumButtonProps) {
  const variants = {
    primary: 'button-premium',
    secondary: 'button-secondary',
    outline: 'border-2 border-teal-500 text-teal-600 dark:text-teal-400 bg-transparent hover:bg-teal-50 dark:hover:bg-teal-900/20',
    ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
    gradient: gradient ? `bg-gradient-to-r ${gradient} text-white` : 'button-premium'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-6 py-3 text-sm rounded-2xl',
    lg: 'px-8 py-4 text-base rounded-2xl',
    xl: 'px-10 py-5 text-lg rounded-3xl'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        font-semibold
        transition-all duration-300
        transform
        shadow-lg
        hover:shadow-xl
        disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:transform-none
        flex items-center justify-center gap-3
        ${className}
      `}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
        />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
        </>
      )}
    </motion.button>
  );
}
