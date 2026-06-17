"use client";

import { getActiveWorkingSchedule } from "../user-form-utils";
import viewStyles from "../view/user-view.module.css";

interface WorkingScheduleViewProps {
  user: {
    workingSchedule?: { day: string; from: string; to: string }[];
    workingDays?: string[];
    workingFrom?: string;
    workingTo?: string;
  };
}

export function WorkingScheduleView({ user }: WorkingScheduleViewProps) {
  const schedule = getActiveWorkingSchedule(user);

  if (schedule.length === 0) {
    return <div className={viewStyles.scheduleEmpty}>No working hours set</div>;
  }

  return (
    <div className={viewStyles.scheduleTable}>
      <div className={viewStyles.scheduleHeader}>
        <span>Day</span>
        <span>From</span>
        <span>To</span>
      </div>

      {schedule.map((entry) => (
        <div key={entry.day} className={`${viewStyles.scheduleRow} ${viewStyles.scheduleRowActive}`}>
          <span className={viewStyles.scheduleDayLabel}>{entry.day}</span>
          <span className={viewStyles.scheduleTime}>{entry.from}</span>
          <span className={viewStyles.scheduleTime}>{entry.to}</span>
        </div>
      ))}
    </div>
  );
}
