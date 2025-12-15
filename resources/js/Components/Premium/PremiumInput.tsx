import { motion } from 'framer-motion';
import { forwardRef, InputHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';

interface PremiumInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'glass' | 'outline';
  containerClassName?: string;
}

const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(({
  label,
  error,
  icon: Icon,
  iconPosition = 'left',
  variant = 'default',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const variants = {
    default: 'input-premium',
    glass: 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/40 dark:border-slate-600/40 rounded-2xl',
    outline: 'bg-transparent border-2 border-slate-300 dark:border-slate-600 rounded-2xl focus:border-teal-500 dark:focus:border-teal-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`space-y-2 ${containerClassName}`}
    >
      {label && (
        <motion.label
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
        )}
        
        <motion.input
          ref={ref}
          whileFocus={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`
            w-full
            ${variants[variant]}
            ${Icon && iconPosition === 'left' ? 'pl-12' : ''}
            ${Icon && iconPosition === 'right' ? 'pr-12' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}
            ${className}
          `}
          {...props}
        />
        
        {Icon && iconPosition === 'right' && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 dark:text-red-400 font-medium"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
});

PremiumInput.displayName = 'PremiumInput';

export default PremiumInput;