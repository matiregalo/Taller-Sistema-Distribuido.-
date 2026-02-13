import { forwardRef, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  optional?: boolean;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, optional, className, id, ...props }, ref) => {
    return (
      <div className="w-full">
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label} {optional && <span className="text-gray-400 font-normal">(Opcional)</span>}
        </label>
        <textarea
          ref={ref}
          id={id}
          className={twMerge(
            clsx(
              "w-full px-4 py-3 rounded-xl border outline-none transition-all resize-none",
              "focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
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
        />
        {error && (
          <p id={`${id}-error`} className="mt-1 text-sm text-red-500 animate-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;
