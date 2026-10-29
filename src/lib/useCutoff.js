import { useEffect, useRef, useState } from "react";

// The score cutoff slider is used in two places (Inbox + Settings). Keep the
// value locally so dragging is instant, and only write it to the profile once
// the user pauses — not on every tick of the slider.
export function useCutoff(profile, setProfile, guest) {
  const saved = profile?.minScoreCutoff ?? 0;
  const [value, setValue] = useState(saved);
  const timer = useRef(null);
  const committed = useRef(saved);

  // Follow the saved value when it changes from elsewhere (login, load),
  // but ignore the echo of our own commit so a continuing drag doesn't jump back.
  useEffect(() => {
    if (saved !== committed.current) {
      committed.current = saved;
      setValue(saved);
    }
  }, [saved]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const update = (v) => {
    setValue(v);
    if (guest) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      committed.current = v;
      setProfile((p) => ({ ...p, minScoreCutoff: v }), { now: true });
    }, 450);
  };

  return [value, update];
}
