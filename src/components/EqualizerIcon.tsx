const BAR_DELAYS = ["-0.4s", "-0.2s", "0s", "-0.3s"];

export default function EqualizerIcon({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-end gap-[3px] h-4 ${className}`} aria-hidden>
      {BAR_DELAYS.map((delay, i) => (
        <span
          key={i}
          className="eq-bar w-[3px] rounded-full bg-gradient-to-t from-neon-pink via-neon-violet to-neon-cyan"
          style={{ height: "100%", animationDelay: delay }}
        />
      ))}
    </span>
  );
}
