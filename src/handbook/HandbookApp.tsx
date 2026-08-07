import plateRegistry from "../../docs/art-guide/assets/plates.json";
import { assetUrl } from "../lib/assets";

export function HandbookApp() {
  return (
    <main className="art-gallery" aria-label="Palari art gallery">
      {plateRegistry.plates.map((plate, index) => (
        <figure className="art-gallery__item" key={plate.id}>
          <picture>
            <source
              media="(max-width: 720px)"
              srcSet={assetUrl(`/handbook/assets/compact/${plate.slug}.webp`)}
            />
            <img
              alt={plate.alt}
              decoding="async"
              loading={index < 4 ? "eager" : "lazy"}
              src={assetUrl(`/handbook/assets/full/${plate.slug}.webp`)}
            />
          </picture>
        </figure>
      ))}
    </main>
  );
}
