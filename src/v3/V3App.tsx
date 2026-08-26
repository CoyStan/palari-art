import { Dice5, Download } from "lucide-react";
import { useState } from "react";
import { assetUrl } from "../lib/assets";
import { AvatarPicker } from "./AvatarPicker";
import { AvatarPreview } from "./AvatarPreview";
import { v3Avatars, type PalariV3Avatar } from "./data";
import { downloadAvatar, type AvatarFrame } from "./download";
import { FrameSelector } from "./FrameSelector";

function initialAvatar() {
  const requestedId = new URLSearchParams(window.location.search).get("palari");
  return v3Avatars.find((avatar) => avatar.id === requestedId) ?? v3Avatars[7];
}

export function V3App() {
  const [avatar, setAvatar] = useState<PalariV3Avatar>(initialAvatar);
  const [frame, setFrame] = useState<AvatarFrame>("soft");
  const [downloading, setDownloading] = useState(false);

  function chooseAvatar(nextAvatar: PalariV3Avatar) {
    setAvatar(nextAvatar);
    const url = new URL(window.location.href);
    url.searchParams.set("palari", nextAvatar.id);
    window.history.replaceState({}, "", url);
  }

  function surprise() {
    const currentIndex = v3Avatars.findIndex((candidate) => candidate.id === avatar.id);
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
        <AvatarPreview avatar={avatar} frame={frame} />

        <section className="v3-chooser" aria-labelledby="v3-title">
          <div className="v3-intro">
            <h1 id="v3-title">Choose your Palari.</h1>
            <p>A little companion with a color and character of its own.</p>
          </div>

          <AvatarPicker avatars={v3Avatars} activeAvatar={avatar} onSelect={chooseAvatar} />
          <FrameSelector frame={frame} onChange={setFrame} />

          <div className="v3-actions">
            <button type="button" className="v3-surprise" onClick={surprise}>
              <Dice5 size={21} aria-hidden="true" /> Surprise me
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
