"use client";

import { useCallback, useEffect, useState } from "react";
import {
  findZipLocation,
  getUsaZipIndex,
  searchZipLocations,
  type ZipLocation,
} from "@/lib/usa-zip-index";

export function useUsaZipIndex() {
  const [index, setIndex] = useState<ZipLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getUsaZipIndex()
      .then((entries) => {
        if (!cancelled) {
          setIndex(entries);
          setLoadError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setIndex([]);
          setLoadError(err instanceof Error ? err.message : "Failed to load zip codes.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const searchByPrefix = useCallback(
    (prefix: string, limit = 50) => searchZipLocations(index, prefix, limit),
    [index]
  );

  const findByZip = useCallback(
    (zip: string) => findZipLocation(index, zip),
    [index]
  );

  return {
    loading,
    loadError,
    searchByPrefix,
    findByZip,
  };
}
