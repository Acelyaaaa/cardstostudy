"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function Card({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-gray-100 bg-white shadow-sm",
        className
      )}
      {...props}
    />
  );
});

export const CardHeader = React.forwardRef
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1 p-5 pb-3", className)}
      {...props}
    />
  );
});

export const CardTitle = React.forwardRef
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={cn(
        "font-semibold text-gray-900 leading-tight",
        className
      )}
      {...props}
    />
  );
});

export const CardContent = React.forwardRef
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardContent({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("p-5 pt-2", className)}
      {...props}
    />
  );
});