import { forwardRef, type SelectHTMLAttributes } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SelectComponentProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectComponentProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    return (
      <div className="w-full">
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={twMerge(
              clsx(
                "w-full px-4 py-3 rounded-xl border outline-none transition-all appearance-none",
                "bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                "disabled:bg-gray-50 disabled:text-gray-400",
                error 
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                  : "border-gray-200"
              ),
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom Arrow Icon */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <svg 
              className={clsx("w-5 h-5", error ? "text-red-400" : "text-gray-400")} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={`${id}-error`} className="mt-1 text-sm text-red-500 animate-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
