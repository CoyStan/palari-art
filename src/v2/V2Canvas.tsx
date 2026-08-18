import { useEffect, useRef, useState } from "react";
import { renderPalariV2, type V2RenderOptions } from "../lib/recolor-v2";
import type { PalariV2Avatar } from "./data";

type V2CanvasProps = {
  avatar: PalariV2Avatar;
  options: V2RenderOptions;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

export function V2Canvas({ avatar, options, canvasRef }: V2CanvasProps) {
  const renderId = useRef(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const id = ++renderId.current;
    setStatus("loading");
    renderPalariV2(canvas, avatar, options)
      .then(() => id === renderId.current && setStatus("ready"))
      .catch(() => id === renderId.current && setStatus("error"));
  }, [avatar, canvasRef, options]);

  return (
    <div className="v2-stage" aria-busy={status === "loading"}>
      <canvas
        ref={canvasRef}
        aria-label={`${avatar.name} ${options.mode === "original" ? "original source" : options.mode} preview`}
      />
      {status !== "ready" && (
        <div className="v2-stage-status" role="status">
          {status === "error"
            ? "Preview unavailable"
            : options.mode === "original" ? "Preparing original…" : options.mode === "emoticon" ? "Preparing emoticon…" : "Preparing ceramic…"}
        </div>
      )}
    </div>
  );
}
