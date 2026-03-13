import { useEffect, useState } from "react";

interface Diamond {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

export default function DiamondRain() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [diamonds, setDiamonds] = useState<Diamond[]>([]);

  useEffect(() => {
    const plan = localStorage.getItem("paidedit_premium_plan");
    if (!plan) return;

    const items: Diamond[] = Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 95,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 2,
      size: 18 + Math.floor(Math.random() * 20),
    }));
    setDiamonds(items);
    setVisible(true);

    const fadeTimer = setTimeout(() => setFading(true), 3500);
    const hideTimer = setTimeout(() => setVisible(false), 4500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        background: "rgba(0,0,0,0.45)",
        opacity: fading ? 0 : 1,
        transition: "opacity 1s ease",
      }}
    >
      <style>{`
        @keyframes diamondFall {
          0% { transform: translateY(-80px) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {diamonds.map((d) => (
        <span
          key={d.id}
          style={{
            position: "absolute",
            left: `${d.x}%`,
            top: 0,
            fontSize: `${d.size}px`,
            animation: `diamondFall ${d.duration}s ${d.delay}s linear forwards`,
            willChange: "transform, opacity",
            filter:
              "drop-shadow(0 0 6px #a855f7) drop-shadow(0 0 12px #7c3aed)",
          }}
        >
          💎
        </span>
      ))}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 64,
            filter: "drop-shadow(0 0 20px #a855f7)",
            marginBottom: 12,
          }}
        >
          💎
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 2,
            textShadow: "0 0 20px #a855f7",
          }}
        >
          PREMIUM MEMBER
        </div>
        <div style={{ fontSize: 14, opacity: 0.8, marginTop: 6 }}>
          Welcome to the Diamond Club!
        </div>
      </div>
    </div>
  );
}
