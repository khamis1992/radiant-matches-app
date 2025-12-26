import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  children?: React.ReactNode;
}

export const SkeletonLoader = ({ className, children, ...props }: SkeletonLoaderProps) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    >
      {children}
    </div>
  );
};

// Booking page specific skeleton components
export const BookingSkeleton = () => {
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center gap-3 px-5 py-4">
          <SkeletonLoader className="w-6 h-6 rounded-full" />
          <div className="flex-1">
            <SkeletonLoader className="h-6 w-32 rounded mb-1" />
            <SkeletonLoader className="h-4 w-20 rounded" />
          </div>
        </div>
        {/* Progress bar skeleton */}
        <div className="h-1 bg-muted">
          <SkeletonLoader className="h-full w-1/3 rounded-none" />
        </div>
      </div>

      {/* Artist & Service Summary Skeleton */}
      <div className="px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <SkeletonLoader className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <SkeletonLoader className="h-5 w-32 rounded mb-2" />
            <SkeletonLoader className="h-4 w-24 rounded" />
          </div>
          <div className="text-end">
            <SkeletonLoader className="h-5 w-16 rounded mb-1" />
            <SkeletonLoader className="h-3 w-12 rounded" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-2 mb-4">
          <SkeletonLoader className="w-5 h-5 rounded" />
          <SkeletonLoader className="h-6 w-32 rounded" />
        </div>
        
        {/* Date selection skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonLoader key={i} className="flex-shrink-0 w-16 h-20 rounded-xl" />
          ))}
        </div>

        {/* Time selection skeleton */}
        <div className="flex items-center gap-2 mt-8 mb-4">
          <SkeletonLoader className="w-5 h-5 rounded" />
          <SkeletonLoader className="h-6 w-32 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonLoader key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Bottom CTA Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-5">
        <SkeletonLoader className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
};

export const BookingDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <SkeletonLoader className="w-6 h-6 rounded-full" />
          <SkeletonLoader className="h-6 w-32 rounded" />
        </div>
      </header>

      {/* Content Skeleton */}
      <div className="px-5 py-6 space-y-4">
        {/* Status Badge Skeleton */}
        <div className="flex items-center justify-between">
          <SkeletonLoader className="h-6 w-24 rounded-full" />
          <SkeletonLoader className="h-4 w-20 rounded" />
        </div>

        {/* Artist Card Skeleton */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-3">
            <SkeletonLoader className="w-14 h-14 rounded-full" />
            <div className="flex-1">
              <SkeletonLoader className="h-5 w-32 rounded mb-2" />
              <SkeletonLoader className="h-4 w-24 rounded" />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <SkeletonLoader className="h-10 flex-1 rounded-xl" />
            <SkeletonLoader className="h-10 flex-1 rounded-xl" />
          </div>
        </div>

        {/* Booking Details Skeleton */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <SkeletonLoader className="h-5 w-32 rounded" />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonLoader className="w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <SkeletonLoader className="h-4 w-16 rounded mb-1" />
                <SkeletonLoader className="h-5 w-32 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SkeletonLoader className="w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <SkeletonLoader className="h-4 w-16 rounded mb-1" />
                <SkeletonLoader className="h-5 w-24 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SkeletonLoader className="w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <SkeletonLoader className="h-4 w-16 rounded mb-1" />
                <SkeletonLoader className="h-5 w-40 rounded" />
                <SkeletonLoader className="h-4 w-32 rounded mt-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Price Summary Skeleton */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <SkeletonLoader className="h-5 w-32 rounded mb-3" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <SkeletonLoader className="h-4 w-20 rounded" />
              <SkeletonLoader className="h-4 w-16 rounded" />
            </div>
            <div className="flex justify-between">
              <SkeletonLoader className="h-4 w-16 rounded" />
              <SkeletonLoader className="h-4 w-12 rounded" />
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <SkeletonLoader className="h-5 w-16 rounded" />
              <SkeletonLoader className="h-6 w-20 rounded" />
            </div>
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex gap-3 pt-2">
          <SkeletonLoader className="h-12 flex-1 rounded-xl" />
          <SkeletonLoader className="h-12 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
