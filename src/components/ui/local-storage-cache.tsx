"use client";

import { useEffect, useState, ReactNode } from "react";

export function LocalStorageCache({ 
  cacheKey, 
  data, 
  children 
}: { 
  cacheKey: string; 
  data?: any; 
  children: (cachedData: any) => ReactNode 
}) {
  const [cached, setCached] = useState<any>(null);

  // Load from cache on mount
  useEffect(() => {
    const saved = localStorage.getItem(`cache-${cacheKey}`);
    if (saved) {
      try {
        setCached(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cache", e);
      }
    }
  }, [cacheKey]);

  // Save to cache when new data arrives from server
  useEffect(() => {
    if (data) {
      localStorage.setItem(`cache-${cacheKey}`, JSON.stringify(data));
    }
  }, [cacheKey, data]);

  return <>{children(data || cached)}</>;
}
