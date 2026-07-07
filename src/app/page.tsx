import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2.5rem 1.5rem",
        background: "#f8fafc",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 720,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2rem", letterSpacing: "-0.02em", color: "#0f172a" }}>
          Coming Soon....
        </h1>
      </section>
    </main>
  );
}
