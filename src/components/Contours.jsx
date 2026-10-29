import React from "react";

// Decorative contour-map rings (deterministic, so no layout shift between renders).
function ring(cx, cy, r, seed) {
  const pts = [];
  const n = 36;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w = 1 + 0.07 * Math.sin(a * 3 + seed) + 0.045 * Math.sin(a * 5 + seed * 1.7);
    pts.push([cx + Math.cos(a) * r * w * 1.25, cy + Math.sin(a) * r * w]);
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let d = `M${mid(pts[n - 1], pts[0]).map((v) => v.toFixed(1))}`;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += `Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${m[0].toFixed(1)},${m[1].toFixed(1)}`;
  }
  return d + "Z";
}

export default function Contours({ className = "", rings = 9, seed = 1 }) {
  return (
    <svg className={`contours ${className}`} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {Array.from({ length: rings }, (_, i) => (
        <path key={i} d={ring(250, 140, 16 + i * 19, seed + i * 0.35)} />
      ))}
    </svg>
  );
}
