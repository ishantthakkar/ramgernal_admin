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
  const [error, setError] = useState("");

  // Auto-redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const validateForm = () => {
    if (!email) {
      setError("Please enter your email address.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setError("Please enter your password.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    return true;
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    
    if (!validateForm()) return;
    
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
        
        // Store permissions and user info
        if (response.permissions) {
          localStorage.setItem("user_permissions", JSON.stringify(response.permissions));
        }
        
        const userInfo = response.admin || response.user;
        if (userInfo) {
          localStorage.setItem("user_info", JSON.stringify(userInfo));
          // Mark if super admin (response has 'admin' object)
          localStorage.setItem("is_super_admin", response.admin ? "true" : "false");
        }

        toast.success("Login successful! Welcome back.");
        router.push("/dashboard");
      } else {
        setError("Authentication failed: No access token received.");
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      const errorMessage = err.message || "Invalid email or password. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
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
        <form 
          className={styles.card} 
          onSubmit={handleLogin}
        >
          <h1 className={styles.heading}>Admin Login</h1>

          {error && (
            <div className={styles.errorAlert}>
              <ArrowRight size={16} style={{ transform: "rotate(180deg)", flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <div className={`${styles.inputWrapper} ${error && !email ? styles.inputError : ""}`}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                type="email"
                placeholder="abc@gmail.com"
                className={styles.input}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <div className={`${styles.inputWrapper} ${error && !password ? styles.inputError : ""}`}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                className={styles.input}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
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
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? "Logging in..." : <>Login <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
