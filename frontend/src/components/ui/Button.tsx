import { type ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    isLoading, 
    fullWidth, 
    className, 
    disabled, 
    ...props 
  }, ref) => {
    
    const baseStyles = "py-4 px-6 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100",
      secondary: "bg-indigo-100 hover:bg-indigo-200 text-indigo-700 shadow-indigo-50",
      outline: "bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 shadow-none",
      danger: "bg-red-600 hover:bg-red-700 text-white shadow-red-100",
    };

    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            baseStyles,
            variants[variant],
            fullWidth ? "w-full" : "w-auto",
            className
          )
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
