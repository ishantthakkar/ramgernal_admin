"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import {
  formatWorkingHoursDisplay,
  getActiveWorkingSchedule,
  type WorkingScheduleItem,
} from "../user-form-utils";
import userStyles from "../users.module.css";

interface WorkingHoursCellProps {
  user: Record<string, unknown>;
}

export function WorkingHoursCell({ user }: WorkingHoursCellProps) {
  const [open, setOpen] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const schedule = getActiveWorkingSchedule(
    user as {
      workingSchedule?: WorkingScheduleItem[];
      workingDays?: string[];
      workingFrom?: string;
      workingTo?: string;
    }
  );
  const summary = formatWorkingHoursDisplay(
    user as {
      workingSchedule?: WorkingScheduleItem[];
      workingDays?: string[];
      workingFrom?: string;
      workingTo?: string;
    }
  );
  const hasSchedule = schedule.length > 0;

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    function checkOverflow() {
      if (!el) return;
      setIsOverflowing(el.scrollWidth > el.clientWidth);
    }

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [summary]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!hasSchedule) {
    return <td className={userStyles.workingHoursCell}>—</td>;
  }

  const canShowPopup = schedule.length > 0 && (isOverflowing || schedule.length > 1);

  return (
    <td className={userStyles.workingHoursCell}>
      <div
        ref={wrapRef}
        className={`${userStyles.workingHoursTrigger} ${canShowPopup ? userStyles.workingHoursTriggerInteractive : ""}`}
        onMouseEnter={() => canShowPopup && setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => canShowPopup && setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (!canShowPopup) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        role={canShowPopup ? "button" : undefined}
        tabIndex={canShowPopup ? 0 : undefined}
        aria-expanded={canShowPopup ? open : undefined}
        aria-label={canShowPopup ? "View working hours" : undefined}
      >
        <span ref={textRef} className={userStyles.workingHoursText}>
          {summary}
        </span>

        {canShowPopup && open && (
          <div className={userStyles.workingHoursPopup} role="tooltip">
            <div className={userStyles.workingHoursPopupTitle}>
              <Clock size={14} />
              Working Hours
            </div>
            <div className={userStyles.workingHoursPopupTable}>
              <div className={userStyles.workingHoursPopupHeader}>
                <span>Day</span>
                <span>From</span>
                <span>To</span>
              </div>
              {schedule.map((entry) => (
                <div key={entry.day} className={userStyles.workingHoursPopupRow}>
                  <span className={userStyles.workingHoursPopupDay}>{entry.day}</span>
                  <span>{entry.from}</span>
                  <span>{entry.to}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </td>
  );
}
