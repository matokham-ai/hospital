import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'feature' | 'glass';
  hover?: boolean;
  gradient?: string;
  onClick?: () => void;
}

export default function PremiumCard({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  gradient,
  onClick 
}: PremiumCardProps) {
  const baseClasses = {
    default: 'card-premium',
    compact: 'card-compact', 
    feature: 'card-feature',
    glass: 'glass-card rounded-3xl p-6'
  };

  const hoverProps = hover ? {
    whileHover: { 
      scale: 1.02,
      y: -4,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    whileTap: { scale: 0.98 }
  } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      {...hoverProps}
      onClick={onClick}
      className={`
        ${baseClasses[variant]} 
        ${gradient ? `bg-gradient-to-br ${gradient}` : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}