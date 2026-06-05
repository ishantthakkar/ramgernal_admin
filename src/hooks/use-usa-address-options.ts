"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/api";
import type { UsaStateEntry } from "@/lib/usa-address";

const stateDataCache = new Map<string, UsaStateEntry>();

function normalizeUsaStateResponse(data: unknown): UsaStateEntry | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  const entry = data[0];
  if (!entry || typeof entry !== "object" || !("state" in entry) || !("cities" in entry)) {
    return null;
  }
  return entry as UsaStateEntry;
}

export function useUsaAddressOptions(state: string, city: string) {
  const [stateData, setStateData] = useState<UsaStateEntry | null>(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const trimmedState = state.trim();
    if (!trimmedState) {
      setStateData(null);
      setLoadError(null);
      return;
    }

    const cached = stateDataCache.get(trimmedState);
    if (cached) {
      setStateData(cached);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setLoadingCities(true);
    setLoadError(null);

    adminApi
      .getUsaStates(trimmedState)
      .then((data) => {
        if (cancelled) return;
        const entry = normalizeUsaStateResponse(data);
        if (!entry) {
          setStateData(null);
          setLoadError("No cities found for this state.");
          return;
        }
        stateDataCache.set(trimmedState, entry);
        setStateData(entry);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStateData(null);
        setLoadError(err instanceof Error ? err.message : "Failed to load cities.");
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });

    return () => {
      cancelled = true;
    };
  }, [state]);

  const cities = useMemo(() => {
    if (!stateData) return [];
    return stateData.cities
      .map((entry) => entry.city)
      .sort((a, b) => a.localeCompare(b));
  }, [stateData]);

  const getZipCodesForCity = useCallback(
    (cityName: string) => {
      if (!stateData || !cityName.trim()) return [];
      const cityEntry = stateData.cities.find((entry) => entry.city === cityName);
      return cityEntry?.zip ?? [];
    },
    [stateData]
  );

  const zipCodes = useMemo(() => getZipCodesForCity(city), [getZipCodesForCity, city]);

  return {
    cities,
    zipCodes,
    getZipCodesForCity,
    loadingCities,
    loadError,
  };
}
