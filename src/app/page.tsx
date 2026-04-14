"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./login.module.css";
import { ArrowRight, ShieldCheck, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

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
          <h1 className={styles.heading}>Enter Mobile Number</h1>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                type="email"
                placeholder="abc@gmai.com"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Access Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                className={styles.input}
              />
              <div 
                className={styles.eyeIcon} 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
            <div className={styles.forgotPassword}>
              FORGOT PASSWORD?
            </div>
          </div>

          <button className={styles.button} onClick={() => router.push("/dashboard")}>
            Login <ArrowRight size={18} />
          </button>

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
        </main>
      </div>

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
