/**
 * Formats any date input into MM/DD/YYYY format.
 * Returns empty string or default fallback if date is invalid or empty.
 */
export function formatDate(dateInput: any, fallback: string = ""): string {
  if (!dateInput) return fallback;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return fallback;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Formats a date to MM/DD/YYYY with time (12-hour AM/PM format).
 */
export function formatDateTime(dateInput: any, fallback: string = ""): string {
  if (!dateInput) return fallback;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return fallback;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');

  return `${month}/${day}/${year}, ${hoursStr}:${minutes} ${ampm}`;
}

/**
 * Formats a date to MM/DD/YYYY with time including seconds (12-hour AM/PM format).
 */
export function formatDateTimeWithSeconds(dateInput: any, fallback: string = ""): string {
  if (!dateInput) return fallback;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return fallback;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');

  return `${month}/${day}/${year}, ${hoursStr}:${minutes}:${seconds} ${ampm}`;
}
