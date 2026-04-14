"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./login.module.css";
import { ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";

const KeypadIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 28"
    fill="currentColor"
    className={className}
  >
    <circle cx="4" cy="4" r="2.5" />
    <circle cx="12" cy="4" r="2.5" />
    <circle cx="20" cy="4" r="2.5" />
    <circle cx="4" cy="12" r="2.5" />
    <circle cx="12" cy="12" r="2.5" />
    <circle cx="20" cy="12" r="2.5" />
    <circle cx="4" cy="20" r="2.5" />
    <circle cx="12" cy="20" r="2.5" />
    <circle cx="20" cy="20" r="2.5" />
    <circle cx="12" cy="28" r="2.5" />
  </svg>
);

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<"login" | "otp">("login");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.systemStatus}>
        <span className={styles.systemDot}></span>
        SYSTEM ONLINE
      </div>

      <header className={styles.logoWrapper}>
        <Image
          src="/ram-logo.png"
          alt="RAM General Supply"
          width={280}
          height={100}
          className={styles.logo}
          priority
        />
      </header>

      <div className={styles.cardWrapper}>
        <main className={styles.card}>
          {step === "login" ? (
            <>
              <h1 className={styles.heading}>Enter Mobile Number</h1>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <div className={styles.inputWrapper}>
                  <KeypadIcon size={18} className={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="65984 22357"
                    className={styles.input}
                  />
                </div>
              </div>
              <button className={styles.button} onClick={() => setStep("otp")}>
                Send OTP <ArrowRight size={18} />
              </button>
            </>
          ) : (
            <>
              <h1 className={styles.heading}>Verify User</h1>
              <p className={styles.subHeading}>
                Enter your OTP received on your registered mobile Number
              </p>
              <div className={styles.otpInputContainer}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    className={styles.otpBox}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    type="text"
                    inputMode="numeric"
                  />
                ))}
              </div>
              <button className={styles.button} onClick={() => router.push("/dashboard")}>
                Verify Mobile Number <ArrowRight size={18} />
              </button>
              <div className={styles.backLink} onClick={() => setStep("login")}>
                <ArrowLeft size={16} /> Back to Login
              </div>
            </>
          )}

          {step === "login" && (
            <footer className={styles.cardFooter}>
              <div className={styles.statusItem}>
                <span className={styles.statusDot}></span>
                NETWORK SECURE
              </div>
              <div className={styles.divider}></div>
              <div className={styles.statusItem}>
                <ShieldCheck size={14} />
                AES-256
              </div>
            </footer>
          )}
        </main>
      </div>

      {step === "otp" && (
        <>
          <div className={styles.stepIndicator}>
            <div className={`${styles.stepSegment} ${styles.stepActive}`}></div>
            <div className={styles.stepSegment}></div>
            <div className={styles.stepSegment}></div>
          </div>

          <p className={styles.securityText}>
            INDUSTRIAL GRADE SECURITY PROTOCOL ACTIVE
          </p>
        </>
      )}

      <footer className={styles.pageFooter}>
        <div className={styles.footerLinks}>
          <a href="#" className={styles.footerLink}>Privacy Policy</a>
          <a href="#" className={styles.footerLink}>Terms of Service</a>
          <a href="#" className={styles.footerLink}>Support</a>
        </div>
        <p className={styles.copyright}>
          © 2026 VOLTCORE INDUSTRIAL. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}
