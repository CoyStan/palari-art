import { Dice5, Download, Sparkles } from "lucide-react";
import { useState } from "react";
import { assetUrl } from "../lib/assets";
import { AvatarPicker } from "./AvatarPicker";
import { AvatarPreview } from "./AvatarPreview";
import { makeGeneratedPalari, v3Avatars, type PalariV3Avatar, type PalariV3Selection } from "./data";
import { downloadAvatar, type AvatarFrame } from "./download";
import { FrameSelector } from "./FrameSelector";
import { MotionSelector } from "./MotionSelector";
import { ViewSelector, type PalariViewMode } from "./ViewSelector";

function initialAvatar(): PalariV3Selection {
  const search = new URLSearchParams(window.location.search);
  const requestedSeed = Number(search.get("seed"));
  if (Number.isSafeInteger(requestedSeed) && requestedSeed > 0) return makeGeneratedPalari(requestedSeed);
  const requestedId = search.get("palari");
  return v3Avatars.find((avatar) => avatar.id === requestedId) ?? v3Avatars[18];
}

export function V3App() {
  const [avatar, setAvatar] = useState<PalariV3Selection>(initialAvatar);
  const [frame, setFrame] = useState<AvatarFrame>("soft");
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [view, setView] = useState<PalariViewMode>("cover");
  const [downloading, setDownloading] = useState(false);

  function chooseAvatar(nextAvatar: PalariV3Avatar) {
    setAvatar(nextAvatar);
    if (!nextAvatar.rig) setView("cover");
    const url = new URL(window.location.href);
    url.searchParams.set("palari", nextAvatar.id);
    url.searchParams.delete("seed");
    window.history.replaceState({}, "", url);
  }

  function generateOne() {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    const generated = makeGeneratedPalari(values[0] || 1);
    setAvatar(generated);
    const url = new URL(window.location.href);
    url.searchParams.set("seed", String(generated.rig.seed));
    url.searchParams.delete("palari");
    window.history.replaceState({}, "", url);
  }

  function surprise() {
    const currentIndex = avatar.kind === "bundled" ? v3Avatars.findIndex((candidate) => candidate.id === avatar.id) : -1;
    if (currentIndex < 0) {
      chooseAvatar(v3Avatars[Math.floor(Math.random() * v3Avatars.length)]);
      return;
    }
    const offset = 1 + Math.floor(Math.random() * (v3Avatars.length - 1));
    chooseAvatar(v3Avatars[(currentIndex + offset) % v3Avatars.length]);
  }

  async function download() {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadAvatar(avatar, frame);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="v3-shell">
      <header className="v3-header">
        <a className="v3-brand" href={assetUrl("v3/")} aria-label="Palari V3 home">
          <span>Palari V3</span>
        </a>
        <a className="v3-archive" href={assetUrl("v2/")}>V2 archive</a>
      </header>

      <section className="v3-workspace">
        <AvatarPreview avatar={avatar} frame={frame} motionEnabled={motionEnabled} view={view} />

        <section className="v3-chooser" aria-labelledby="v3-title">
          <div className="v3-intro">
            <h1 id="v3-title">Choose your Palari.</h1>
            <p>Pick one, or grow a new companion from bones, soft cover, color, and a seed.</p>
          </div>

          <AvatarPicker avatars={v3Avatars} activeAvatar={avatar} onSelect={chooseAvatar} />
          <div className="v3-controls">
            <FrameSelector frame={frame} onChange={setFrame} />
            <ViewSelector view={view} enabled={Boolean(avatar.rig)} onChange={setView} />
            <MotionSelector enabled={motionEnabled} onChange={setMotionEnabled} />
          </div>

          <div className="v3-actions">
            <button type="button" className="v3-surprise" onClick={surprise}>
              <Dice5 size={21} aria-hidden="true" /> Surprise me
            </button>
            <button type="button" className="v3-generate" onClick={generateOne}>
              <Sparkles size={21} aria-hidden="true" /> Make one
            </button>
            <button type="button" className="v3-download" onClick={() => void download()} disabled={downloading}>
              <Download size={22} aria-hidden="true" /> {downloading ? "Preparing…" : "Download avatar"}
            </button>
          </div>
        </section>
      </section>

      <footer>Personal Artificial Intelligence</footer>
    </main>
  );
}
