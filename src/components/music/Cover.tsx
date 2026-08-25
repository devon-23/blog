import { bestImage, colorFor, initial, type LastfmImage } from './lastfmClient';

interface Props {
  images?: LastfmImage[];
  label: string;
  size?: string;
  className?: string;
}

export default function Cover({ images, label, size, className }: Props) {
  const url = bestImage(images, size);
  if (url) {
    return <img className={`cover ${className ?? ''}`} src={url} alt="" loading="lazy" />;
  }
  return (
    <div className={`cover cover-fallback ${className ?? ''}`} style={{ background: colorFor(label || '?') }}>
      {initial(label)}
    </div>
  );
}
