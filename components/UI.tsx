
import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className, 
  ...props 
}) => {
  const base = "relative z-10 px-8 py-4 text-sm font-bold transition-all duration-300 rounded-sm tracking-[0.2em] uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer overflow-hidden";
  const variants = {
    primary: "bg-[#7d7463] text-white hover:bg-[#2d2a26] shadow-xl shadow-[#7d7463]/10",
    secondary: "bg-[#f5f2ed] text-[#2d2a26] hover:bg-[#b5a48b] hover:text-white",
    outline: "border border-[#7d7463] text-[#7d7463] hover:bg-[#7d7463] hover:text-white"
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${base} ${variants[variant]} ${className || ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center pointer-events-none">
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          מפיק תובנה...
        </span>
      ) : children}
    </motion.button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative z-0 bg-white border border-[#2d2a26]/5 p-12 shadow-[0_10px_40px_rgba(0,0,0,0.02)] rounded-sm ${className || ''}`}
  >
    {children}
  </motion.div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
  <div className="flex flex-col space-y-2 mb-6 relative z-10">
    <label className="text-[10px] uppercase tracking-[0.3em] text-[#2d2a26]/40 font-bold">{label}</label>
    <input 
      {...props} 
      className="border-b border-[#2d2a26]/10 py-3 focus:border-[#7d7463] outline-none transition-all duration-500 bg-transparent text-[#2d2a26] placeholder:text-[#2d2a26]/20"
    />
  </div>
);
