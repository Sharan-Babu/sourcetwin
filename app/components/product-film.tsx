import { productFilmUrl } from "../product-film-url";

export function ProductFilm() {
  return (
    <section className="section film-section" id="watch">
      <div className="section-heading section-heading--split film-heading">
        <div>
          <span className="kicker">Watch Source Twin at work</span>
          <h2>From a cancellation question to reviewed code.</h2>
        </div>
        <p>
          Follow an illustrative subscription app as a user and coding agent agree on behavior,
          uncover a billing catch, and review the English, code, and tests together.
        </p>
      </div>

      <div className="film-frame">
        <video
          aria-label="Source Twin product walkthrough"
          controls
          playsInline
          poster="/source-twin-launch-film-poster.jpg"
          preload="metadata"
        >
          <source src={productFilmUrl} type="video/mp4" />
          <track
            default
            kind="captions"
            label="English"
            src="/source-twin-launch-film-en.vtt"
            srcLang="en"
          />
          Your browser cannot play this video.
        </video>
      </div>
    </section>
  );
}
