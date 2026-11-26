import React, { useId } from "react";

import { cn } from "@/lib/utils";

interface FieldWrapperProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FieldWrapper({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FieldWrapperProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm sm:text-[15px] font-semibold text-ink"
      >
        {label}
        {required ? <span className="ml-1 text-[#A14B2C]">*</span> : null}
      </label>

      {children}

      {error ? (
        <p role="alert" className="text-xs sm:text-[13px] font-medium text-[#8C371C]">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs sm:text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const CONTROL_BASE =
  "w-full rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-[15px] sm:text-base text-ink placeholder:text-muted/75 transition focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-65";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, id, required, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const control = (
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn(
          CONTROL_BASE,
          error && "border-[#C25E3B] focus:border-[#A14B2C] focus:ring-[#C25E3B]/15",
          className
        )}
        {...props}
      />
    );

    if (!label) return control;

    return (
      <FieldWrapper
        label={label}
        htmlFor={inputId}
        hint={hint}
        error={error}
        required={required}
      >
        {control}
      </FieldWrapper>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, id, required, className, rows = 3, ...props }, ref) => {
    const generatedId = useId();
    const areaId = id ?? generatedId;

    const control = (
      <textarea
        ref={ref}
        id={areaId}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn(
          CONTROL_BASE,
          "resize-y",
          error && "border-[#C25E3B] focus:border-[#A14B2C] focus:ring-[#C25E3B]/15",
          className
        )}
        {...props}
      />
    );

    if (!label) return control;

    return (
      <FieldWrapper
        label={label}
        htmlFor={areaId}
        hint={hint}
        error={error}
        required={required}
      >
        {control}
      </FieldWrapper>
    );
  }
);
Textarea.displayName = "Textarea";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, id, required, className, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    const control = (
      <select
        ref={ref}
        id={selectId}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn(
          CONTROL_BASE,
          error && "border-[#C25E3B] focus:border-[#A14B2C] focus:ring-[#C25E3B]/15",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );

    if (!label) return control;

    return (
      <FieldWrapper
        label={label}
        htmlFor={selectId}
        hint={hint}
        error={error}
        required={required}
      >
        {control}
      </FieldWrapper>
    );
  }
);
Select.displayName = "Select";
