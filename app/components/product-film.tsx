import { productFilmUrl } from "../product-film-url";

export function ProductFilm() {
  return (
    <section className="section film-section" id="watch">
      <div className="section-heading section-heading--split film-heading">
        <div>
          <span className="kicker">Watch Source Twin at work</span>
          <h2>From a mistaken message to reviewed code.</h2>
        </div>
        <p>
          See a user and coding agent agree on behavior, uncover an important exception,
          update the code and tests, and review the whole change together.
        </p>
      </div>

      <div className="film-frame">
        <video
          aria-label="Source Twin product walkthrough"
          controls
          playsInline
          poster="/source-twin-walkthrough-poster.jpg"
          preload="metadata"
        >
          <source src={productFilmUrl} type="video/mp4" />
          <track
            default
            kind="captions"
            label="English"
            src="/source-twin-walkthrough-en.vtt"
            srcLang="en"
          />
          Your browser cannot play this video.
        </video>
      </div>
    </section>
  );
}
