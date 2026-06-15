"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { US_STATE_NAMES } from "@/lib/usa-address";
import { useUsaAddressOptions } from "@/hooks/use-usa-address-options";
import { useUsaZipIndex } from "@/hooks/use-usa-zip-index";

interface UsaAddressFieldsProps {
  city: string;
  state: string;
  zip: string;
  onChange: (updates: Partial<{ city: string; state: string; zip: string }>) => void;
  formGroupClassName: string;
  formSelectClassName: string;
  flow?: "stateFirst" | "zipFirst";
}

const chevronStyle: React.CSSProperties = {
  position: "absolute",
  right: "1rem",
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  color: "#64748b",
};

function SelectField({
  label,
  value,
  disabled,
  onChange,
  options,
  placeholder,
  formGroupClassName,
  formSelectClassName,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  formGroupClassName: string;
  formSelectClassName: string;
}) {
  return (
    <div className={formGroupClassName}>
      <label>{label}</label>
      <div style={{ position: "relative" }}>
        <select
          className={formSelectClassName}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown size={18} style={chevronStyle} />
      </div>
    </div>
  );
}

function withCurrentValue(options: string[], currentValue: string) {
  if (!currentValue || options.includes(currentValue)) return options;
  return [currentValue, ...options];
}

function UsaAddressFieldsStateFirst({
  city,
  state,
  zip,
  onChange,
  formGroupClassName,
  formSelectClassName,
}: Omit<UsaAddressFieldsProps, "flow">) {
  const { cities, zipCodes, getZipCodesForCity, loadingCities, loadError } =
    useUsaAddressOptions(state, city);

  const cityOptions = useMemo(() => withCurrentValue(cities, city), [cities, city]);
  const zipOptions = useMemo(() => withCurrentValue(zipCodes, zip), [zipCodes, zip]);

  function handleStateChange(nextState: string) {
    onChange({ state: nextState, city: "", zip: "" });
  }

  function handleCityChange(nextCity: string) {
    if (!nextCity) {
      onChange({ city: "", zip: "" });
      return;
    }

    const nextZips = getZipCodesForCity(nextCity);
    onChange({
      city: nextCity,
      zip: nextZips.length === 1 ? nextZips[0] : "",
    });
  }

  return (
    <>
      <SelectField
        label="State"
        value={state}
        onChange={handleStateChange}
        options={[...US_STATE_NAMES]}
        placeholder="Select state"
        formGroupClassName={formGroupClassName}
        formSelectClassName={formSelectClassName}
      />

      <SelectField
        label="City"
        value={city}
        disabled={!state || loadingCities}
        onChange={handleCityChange}
        options={cityOptions}
        placeholder={loadingCities ? "Loading cities..." : "Select city"}
        formGroupClassName={formGroupClassName}
        formSelectClassName={formSelectClassName}
      />

      {loadError && state ? (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#b91c1c" }}>{loadError}</p>
      ) : null}

      <SelectField
        label="Zip"
        value={zip}
        disabled={!city || zipOptions.length === 0}
        onChange={(nextZip) => onChange({ zip: nextZip })}
        options={zipOptions}
        placeholder={zipOptions.length === 0 ? "Select city first" : "Select zip code"}
        formGroupClassName={formGroupClassName}
        formSelectClassName={formSelectClassName}
      />
    </>
  );
}

function UsaAddressFieldsZipFirst({
  city,
  state,
  zip,
  onChange,
  formGroupClassName,
  formSelectClassName,
}: Omit<UsaAddressFieldsProps, "flow">) {
  const { loading, loadError, searchByPrefix, findByZip } = useUsaZipIndex();
  const [zipError, setZipError] = useState<string | null>(null);
  const datalistId = useMemo(
    () => `zip-suggestions-${Math.random().toString(36).slice(2)}`,
    []
  );

  const suggestions = useMemo(() => {
    if (zip.trim().length < 3) return [];
    return searchByPrefix(zip, 50);
  }, [searchByPrefix, zip]);

  function applyZipMatch(nextZip: string) {
    const match = findByZip(nextZip);
    if (!match) {
      setZipError("Zip code not found.");
      onChange({ zip: nextZip, city: "", state: "" });
      return;
    }

    setZipError(null);
    onChange({
      zip: match.zip,
      city: match.city,
      state: match.state,
    });
  }

  function handleZipChange(nextZip: string) {
    const digitsOnly = nextZip.replace(/\D/g, "").slice(0, 5);
    setZipError(null);

    if (!digitsOnly) {
      onChange({ zip: "", city: "", state: "" });
      return;
    }

    if (digitsOnly.length < 5) {
      onChange({ zip: digitsOnly, city: "", state: "" });
      return;
    }

    applyZipMatch(digitsOnly);
  }

  function handleZipPick(selectedZip: string) {
    if (!/^\d{5}$/.test(selectedZip)) return;
    applyZipMatch(selectedZip);
  }

  return (
    <>
      <div className={formGroupClassName}>
        <label>Zip</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          className={formSelectClassName}
          value={zip}
          list={datalistId}
          disabled={loading}
          placeholder={loading ? "Loading zip codes..." : "Select or type zip code"}
          onChange={(e) => handleZipChange(e.target.value)}
          onBlur={(e) => handleZipPick(e.target.value.trim())}
        />
        <datalist id={datalistId}>
          {suggestions.map((entry) => (
            <option key={`${entry.zip}-${entry.city}`} value={entry.zip}>
              {entry.city}, {entry.state}
            </option>
          ))}
        </datalist>
        {loadError ? (
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "#b91c1c" }}>{loadError}</p>
        ) : null}
        {zipError ? (
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "#b91c1c" }}>{zipError}</p>
        ) : null}
      </div>

      <SelectField
        label="City"
        value={city}
        disabled
        onChange={() => undefined}
        options={city ? [city] : []}
        placeholder="Auto-filled from zip"
        formGroupClassName={formGroupClassName}
        formSelectClassName={formSelectClassName}
      />

      <SelectField
        label="State"
        value={state}
        disabled
        onChange={() => undefined}
        options={state ? [state] : []}
        placeholder="Auto-filled from zip"
        formGroupClassName={formGroupClassName}
        formSelectClassName={formSelectClassName}
      />
    </>
  );
}

export function UsaAddressFields({
  flow = "stateFirst",
  ...props
}: UsaAddressFieldsProps) {
  if (flow === "zipFirst") {
    return <UsaAddressFieldsZipFirst {...props} />;
  }

  return <UsaAddressFieldsStateFirst {...props} />;
}
