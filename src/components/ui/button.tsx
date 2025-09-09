"use client";

import * as React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: false;
  variant?: "default" | "ghost" | "outline" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "default", size = "default", ...props },
  ref
) {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variantClasses = {
    default: "bg-black text-white hover:opacity-90",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
    outline: "border border-gray-300 bg-white hover:bg-gray-50",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    destructive: "bg-red-600 text-white hover:bg-red-700"
  };
  
  const sizeClasses = {
    default: "h-9 px-4 py-2",
    sm: "h-8 px-3 text-xs",
    lg: "h-10 px-8",
    icon: "h-9 w-9"
  };

  return (
    <button
      ref={ref}
      className={[
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      ].join(" ")}
      {...props}
    />
  );
});
