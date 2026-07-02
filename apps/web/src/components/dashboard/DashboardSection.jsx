import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

const DashboardSection = ({ title, description, children, className = '', action }) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {(title || action) && (
        <motion.div variants={itemVariants} className="flex items-end justify-between mb-6">
          <div>
            {title && <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>}
            {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </motion.div>
      )}
      {children}
    </motion.div>
  );
};

export { containerVariants, itemVariants };
export default DashboardSection;
