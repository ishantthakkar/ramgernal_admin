"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./login.module.css";
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api";
import { toast } from "react-toastify";

export default function Home() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      console.log("Full API Response:", response);

      // Look for token in all common locations
      const token =
        response.token ||
        response.accessToken ||
        response.access_token ||
        response.jwt ||
        response.data?.token ||
        response.data?.accessToken;

      if (token) {
        localStorage.setItem("auth_token", token);
        toast.success("Login successful! Welcome back.");
        router.push("/dashboard");
      } else {
        const keys = Object.keys(response).join(", ");
        toast.error(`Authentication error: Token not found.`);
        console.warn(`Response keys found: ${keys}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>


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
          <h1 className={styles.heading}>Admin Login</h1>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                type="email"
                placeholder="abc@gmai.com"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div
                className={styles.eyeIcon}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>


          <button
            className={styles.button}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Login..." : <>Login <ArrowRight size={18} /></>}
          </button>


        </main>
      </div>


    </div>
  );
}
