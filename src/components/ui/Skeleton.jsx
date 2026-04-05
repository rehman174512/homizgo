import React from 'react'

/**
 * A placeholder component that represents a loading shape with a shimmer animation.
 * Usage: <Skeleton className="h-4 w-[250px] rounded-full" />
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-muted/60 before:absolute before:inset-0 before:animate-shimmer before:content-[''] ${className}`}
      {...props}
    />
  )
}
