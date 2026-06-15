import { adminApi } from "@/lib/api";
import type { UsaStateEntry } from "@/lib/usa-address";

export interface ZipLocation {
  zip: string;
  city: string;
  state: string;
}

let zipIndexPromise: Promise<ZipLocation[]> | null = null;

async function buildZipIndex(): Promise<ZipLocation[]> {
  const data = await adminApi.getUsaStates();
  if (!Array.isArray(data)) return [];

  const entries: ZipLocation[] = [];

  for (const stateEntry of data as UsaStateEntry[]) {
    for (const cityEntry of stateEntry.cities || []) {
      for (const zipValue of cityEntry.zip || []) {
        entries.push({
          zip: String(zipValue),
          city: cityEntry.city,
          state: stateEntry.state,
        });
      }
    }
  }

  return entries;
}

export function getUsaZipIndex(): Promise<ZipLocation[]> {
  if (!zipIndexPromise) {
    zipIndexPromise = buildZipIndex();
  }
  return zipIndexPromise;
}

export function searchZipLocations(
  index: ZipLocation[],
  prefix: string,
  limit = 50
): ZipLocation[] {
  const normalizedPrefix = prefix.trim();
  if (!normalizedPrefix || !/^\d{1,5}$/.test(normalizedPrefix)) return [];

  const results: ZipLocation[] = [];
  for (const entry of index) {
    if (!entry.zip.startsWith(normalizedPrefix)) continue;
    results.push(entry);
    if (results.length >= limit) break;
  }
  return results;
}

export function findZipLocation(index: ZipLocation[], zip: string): ZipLocation | null {
  const normalizedZip = zip.trim();
  if (!/^\d{5}$/.test(normalizedZip)) return null;
  return index.find((entry) => entry.zip === normalizedZip) ?? null;
}
