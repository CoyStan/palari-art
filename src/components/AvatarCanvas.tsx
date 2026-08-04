import { forwardRef, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  renderRecoloredAvatar,
  type AvatarMaskSources,
  type RecolorSettings,
} from "../lib/recolor";

type AvatarCanvasProps = {
  src: string;
  settings: RecolorSettings;
  masks?: AvatarMaskSources;
  onReadyChange: (ready: boolean) => void;
};

export const AvatarCanvas = forwardRef<HTMLCanvasElement, AvatarCanvasProps>(
  function AvatarCanvas({ src, settings, masks, onReadyChange }, forwardedRef) {
    const localRef = useRef<HTMLCanvasElement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      let active = true;
      let timer = 0;
      setLoading(true);
      setError(null);
      onReadyChange(false);

      // A timer also runs when the editor is open in a background tab. That
      // matters for shared-server use, where browser previews are often hidden.
      timer = window.setTimeout(() => {
        const canvas = localRef.current;
        if (!canvas) return;
        renderRecoloredAvatar(canvas, src, settings, masks)
          .then(() => {
            if (!active) return;
            setLoading(false);
            onReadyChange(true);
          })
          .catch((cause: unknown) => {
            if (!active) return;
            setLoading(false);
            setError(cause instanceof Error ? cause.message : "The portrait could not be processed.");
            onReadyChange(false);
          });
      });

      return () => {
        active = false;
        window.clearTimeout(timer);
      };
    }, [masks?.foreground, masks?.matte, masks?.shirt, onReadyChange, settings, src]);

    return (
      <div className="canvas-shell" aria-busy={loading}>
        <canvas
          ref={(node) => {
            localRef.current = node;
            if (typeof forwardedRef === "function") forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
          }}
          aria-label="Recolored avatar preview"
        />
        {loading ? (
          <div className="canvas-state">
            <LoaderCircle aria-hidden="true" className="spin" size={22} />
            <span>Preparing layers…</span>
          </div>
        ) : null}
        {error ? <div className="canvas-state canvas-error">{error}</div> : null}
      </div>
    );
  },
);
