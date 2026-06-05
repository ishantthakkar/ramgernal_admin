"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { US_STATE_NAMES } from "@/lib/usa-address";
import { useUsaAddressOptions } from "@/hooks/use-usa-address-options";

interface UsaAddressFieldsProps {
  city: string;
  state: string;
  zip: string;
  onChange: (updates: Partial<{ city: string; state: string; zip: string }>) => void;
  formGroupClassName: string;
  formSelectClassName: string;
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

export function UsaAddressFields({
  city,
  state,
  zip,
  onChange,
  formGroupClassName,
  formSelectClassName,
}: UsaAddressFieldsProps) {
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
