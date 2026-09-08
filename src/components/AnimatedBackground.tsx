export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      <div
        className="blob"
        style={{
          top: "-10%",
          left: "-10%",
          width: "38vw",
          height: "38vw",
          background: "var(--neon-pink)",
        }}
      />
      <div
        className="blob"
        style={{
          top: "20%",
          right: "-15%",
          width: "42vw",
          height: "42vw",
          background: "var(--neon-violet)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="blob"
        style={{
          bottom: "-15%",
          left: "10%",
          width: "34vw",
          height: "34vw",
          background: "var(--neon-cyan)",
          animationDelay: "-11s",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
    </div>
  );
}
