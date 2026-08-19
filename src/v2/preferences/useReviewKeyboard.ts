import { useEffect } from "react";
import type { PreferenceVerdict } from "./model";

const keyboardVerdicts: Record<string, PreferenceVerdict> = {
  "1": "favorite",
  "2": "keep",
  "3": "mixed",
  "4": "avoid",
};

type ReviewKeyboardOptions = {
  enabled: boolean;
  onVerdict: (verdict: PreferenceVerdict) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function useReviewKeyboard({ enabled, onVerdict, onPrevious, onNext }: ReviewKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      const verdict = keyboardVerdicts[event.key];
      if (verdict) {
        event.preventDefault();
        onVerdict(verdict);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onNext, onPrevious, onVerdict]);
}
