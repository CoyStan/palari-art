import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import plateRegistry from "../../docs/art-guide/assets/plates.json";
import { assetUrl } from "../lib/assets";
import {
  bibliographyLinks,
  chapters,
  pages,
  supportingAvatars,
  type HandbookPage,
} from "./content";

const plateById = new Map(plateRegistry.plates.map((plate) => [plate.id, plate]));
const avatarById = new Map(supportingAvatars.map((avatar) => [avatar.id, avatar]));

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function pageFromHash() {
  const match = window.location.hash.match(/^#page-(\d{1,2})$/);
  if (!match) return 1;
  return Math.min(80, Math.max(1, Number(match[1])));
}

function Plate({ id }: { id: number }) {
  const plate = plateById.get(id);
  if (!plate) return null;
  return (
    <figure className="handbook-figure">
      <picture>
        <source
          media="(max-width: 720px)"
          srcSet={assetUrl(`/handbook/assets/compact/${plate.slug}.webp`)}
        />
        <img
          alt={plate.alt}
          decoding="async"
          loading="eager"
          src={assetUrl(`/handbook/assets/full/${plate.slug}.webp`)}
        />
      </picture>
    </figure>
  );
}

function AvatarStudies({ ids }: { ids: string[] }) {
  const avatars = ids.map((id) => avatarById.get(id)).filter(Boolean);
  if (!avatars.length) return null;
  return (
    <div className="avatar-studies" aria-label="Palari library examples">
      {avatars.map((avatar) => avatar && (
        <figure key={avatar.id}>
          <img alt={`${avatar.label}, shown as a visual construction example`} src={assetUrl(avatar.src)} />
          <figcaption>{avatar.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function ChapterContents() {
  return (
    <ol className="contents-list">
      {chapters.map((chapter) => (
        <li key={chapter.id}>
          <span>{String(chapter.number).padStart(2, "0")}</span>
          <strong>{chapter.title}</strong>
          <small>{chapter.start}–{chapter.end}</small>
        </li>
      ))}
    </ol>
  );
}

function HandbookPageView({ page }: { page: HandbookPage }) {
  const showBibliography = page.number === 79;
  return (
    <article
      aria-label={`Page ${page.number}: ${page.title}`}
      className={`book-page page-${page.layout} accent-${page.accent ?? "coral"}`}
      data-page={page.number}
      id={`page-${page.number}`}
    >
      <div className="page-wash" aria-hidden="true" />
      <div className="page-content">
        <header className="page-heading">
          {page.layout === "opener" && <span className="chapter-number">{String(chapters.find((chapter) => chapter.id === page.chapter)?.number ?? "").padStart(2, "0")}</span>}
          <h1>{page.title}</h1>
          <p>{page.deck}</p>
        </header>

        {page.layout === "contents" && <ChapterContents />}
        {page.body && <p className="page-body">{page.body}</p>}
        {page.bullets && (
          <ul className="page-bullets">
            {page.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
          </ul>
        )}
        {showBibliography && (
          <ul className="bibliography-links">
            {bibliographyLinks.map((reference) => (
              <li key={reference.href}><a href={reference.href}>{reference.label}</a></li>
            ))}
          </ul>
        )}
        {page.plateId && <Plate id={page.plateId} />}
        {page.avatarIds && <AvatarStudies ids={page.avatarIds} />}
      </div>
      <footer className="page-footer">
        <span>Palari Character Design Handbook</span>
        <span>{String(page.number).padStart(2, "0")}</span>
      </footer>
    </article>
  );
}

function PrintBook() {
  return (
    <main className="print-document">
      {pages.map((bookPage) => <HandbookPageView key={bookPage.number} page={bookPage} />)}
    </main>
  );
}

export function HandbookApp() {
  const printMode = new URLSearchParams(window.location.search).has("print");
  const mobile = useMediaQuery("(max-width: 760px)");
  const [currentPage, setCurrentPage] = useState(pageFromHash);
  const step = mobile ? 1 : 2;

  useEffect(() => {
    const onHashChange = () => setCurrentPage(pageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((pageNumber: number) => {
    const bounded = Math.min(80, Math.max(1, pageNumber));
    setCurrentPage(bounded);
    window.history.replaceState(null, "", `#page-${bounded}`);
  }, []);

  useEffect(() => {
    if (printMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown") navigate(currentPage + step);
      if (event.key === "ArrowLeft" || event.key === "PageUp") navigate(currentPage - step);
      if (event.key === "Home") navigate(1);
      if (event.key === "End") navigate(80);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentPage, navigate, printMode, step]);

  const visiblePages = useMemo(() => {
    if (mobile) return pages.slice(currentPage - 1, currentPage);
    const leftPage = currentPage % 2 === 0 ? currentPage - 1 : currentPage;
    return pages.slice(leftPage - 1, leftPage + 1);
  }, [currentPage, mobile]);

  if (printMode) return <PrintBook />;

  const activeChapter = chapters.find((chapter) => currentPage >= chapter.start && currentPage <= chapter.end);
  return (
    <div className="handbook-shell">
      <header className="handbook-header">
        <a className="handbook-wordmark" href={assetUrl("/")}>Palari Art</a>
        <nav aria-label="Palari Art">
          <a href={assetUrl("/")}>Color studio</a>
          <a aria-current="page" href={assetUrl("/handbook/")}>Handbook</a>
        </nav>
      </header>

      <main className="reader-layout">
        <aside className="chapter-rail" aria-label="Handbook chapters">
          <span>Chapters</span>
          <div className="chapter-select-wrap">
            <label htmlFor="chapter-select">Chapter</label>
            <select
              id="chapter-select"
              onChange={(event) => navigate(Number(event.target.value))}
              value={activeChapter?.start ?? 1}
            >
              <option value="1">Front matter</option>
              {chapters.map((chapter) => <option key={chapter.id} value={chapter.start}>{chapter.number}. {chapter.shortTitle}</option>)}
            </select>
          </div>
          <ol>
            {chapters.map((chapter) => (
              <li key={chapter.id}>
                <button
                  aria-current={activeChapter?.id === chapter.id ? "step" : undefined}
                  aria-label={`Chapter ${chapter.number}: ${chapter.title}`}
                  onClick={() => navigate(chapter.start)}
                  type="button"
                >
                  {String(chapter.number).padStart(2, "0")}
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <section className="reader-stage" aria-live="polite">
          <div className={`reader-book ${mobile ? "single-page" : "spread"}`}>
            {visiblePages.map((bookPage) => <HandbookPageView key={bookPage.number} page={bookPage} />)}
          </div>
        </section>
      </main>

      <footer className="reader-controls">
        <button disabled={currentPage <= 1} onClick={() => navigate(currentPage - step)} type="button">
          <ArrowLeft aria-hidden="true" /> <span>Previous</span>
        </button>
        <output aria-label={`Page ${currentPage} of 80`}>
          <strong>{String(currentPage).padStart(2, "0")}</strong><span>/</span><span>80</span>
        </output>
        <button disabled={currentPage >= 80} onClick={() => navigate(currentPage + step)} type="button">
          <span>Next</span> <ArrowRight aria-hidden="true" />
        </button>
        <a className="pdf-link" download href={assetUrl("/handbook/palari-character-design-handbook.pdf")}>
          <Download aria-hidden="true" /> <span>Download PDF</span>
        </a>
      </footer>
    </div>
  );
}
