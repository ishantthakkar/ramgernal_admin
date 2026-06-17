"use client";

import addStyles from "../add/user-add.module.css";
import type { DayScheduleEntry, TimeValue } from "../user-form-utils";

interface WorkingScheduleEditorProps {
  schedule: DayScheduleEntry[];
  onChange: (schedule: DayScheduleEntry[]) => void;
}

function togglePeriod(value: TimeValue): TimeValue {
  return {
    ...value,
    period: value.period === "AM" ? "PM" : "AM",
  };
}

export function WorkingScheduleEditor({ schedule, onChange }: WorkingScheduleEditorProps) {
  function updateEntry(day: string, patch: Partial<DayScheduleEntry>) {
    onChange(
      schedule.map((entry) => (entry.day === day ? { ...entry, ...patch } : entry))
    );
  }

  function updateTime(
    day: string,
    field: "from" | "to",
    patch: Partial<TimeValue>
  ) {
    onChange(
      schedule.map((entry) => {
        if (entry.day !== day) return entry;
        return {
          ...entry,
          [field]: { ...entry[field], ...patch },
        };
      })
    );
  }

  return (
    <div className={addStyles.scheduleTable}>
      <div className={addStyles.scheduleHeader}>
        <span>Day</span>
        <span>Working</span>
        <span>From</span>
        <span>To</span>
      </div>

      {schedule.map((entry) => (
        <div
          key={entry.day}
          className={`${addStyles.scheduleRow} ${entry.enabled ? addStyles.scheduleRowActive : ""}`}
        >
          <span className={addStyles.scheduleDayLabel}>{entry.day}</span>

          <label className={addStyles.scheduleToggle}>
            <input
              type="checkbox"
              checked={entry.enabled}
              onChange={(e) => updateEntry(entry.day, { enabled: e.target.checked })}
            />
            <span>{entry.enabled ? "Yes" : "Off"}</span>
          </label>

          <div className={addStyles.timeInputWrap}>
            <input
              type="time"
              className={addStyles.timeInput}
              value={entry.from.time}
              disabled={!entry.enabled}
              onChange={(e) => updateTime(entry.day, "from", { time: e.target.value })}
            />
            <button
              type="button"
              className={`${addStyles.periodToggle} ${addStyles.periodToggleActive}`}
              disabled={!entry.enabled}
              onClick={() => updateTime(entry.day, "from", togglePeriod(entry.from))}
            >
              {entry.from.period}
            </button>
          </div>

          <div className={addStyles.timeInputWrap}>
            <input
              type="time"
              className={addStyles.timeInput}
              value={entry.to.time}
              disabled={!entry.enabled}
              onChange={(e) => updateTime(entry.day, "to", { time: e.target.value })}
            />
            <button
              type="button"
              className={`${addStyles.periodToggle} ${addStyles.periodToggleActive}`}
              disabled={!entry.enabled}
              onClick={() => updateTime(entry.day, "to", togglePeriod(entry.to))}
            >
              {entry.to.period}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
