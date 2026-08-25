import type { DesktopGalleryImage } from '../desktop/types';

interface Props {
  images: DesktopGalleryImage[];
}

export default function GalleryApp({ images }: Props) {
  if (images.length === 0) {
    return (
      <p className="app-empty">
        No photos yet — add a <code>coverImage</code> or <code>gallery</code> to any article, think
        piece, recommendation, or goal log.
      </p>
    );
  }

  return (
    <div className="gallery-app-grid">
      {images.map((img, i) => (
        <a key={i} className="gallery-app-tile" href={img.sourceHref} title={img.sourceTitle}>
          <img src={img.src} alt={img.sourceTitle} loading="lazy" />
        </a>
      ))}
    </div>
  );
}
