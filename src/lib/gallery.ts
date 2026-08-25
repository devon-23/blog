import { getCollection } from 'astro:content';
import { postHref, recommendationHref, goalLogHref } from './paths';

export interface GalleryImage {
  src: string;
  width: number;
  height: number;
  sourceTitle: string;
  sourceHref: string;
  sourceKind: 'Article' | 'Think Piece' | 'Update' | 'Recommendation' | 'Goal log';
  date: Date;
}

const POST_KIND: Record<string, GalleryImage['sourceKind']> = {
  article: 'Article',
  thinkpiece: 'Think Piece',
  update: 'Update',
};

export async function getAllGalleryImages(): Promise<GalleryImage[]> {
  const [posts, recs, logs] = await Promise.all([
    getCollection('posts', ({ data }) => !data.draft),
    getCollection('recommendations', ({ data }) => !data.draft),
    getCollection('goalLogs', ({ data }) => !data.draft),
  ]);

  const images: GalleryImage[] = [];

  for (const post of posts) {
    const href = postHref(post);
    const kind = POST_KIND[post.data.type];
    const all = [...(post.data.coverImage ? [post.data.coverImage] : []), ...post.data.gallery];
    for (const img of all) {
      images.push({ src: img.src, width: img.width, height: img.height, sourceTitle: post.data.title, sourceHref: href, sourceKind: kind, date: post.data.date });
    }
  }

  for (const rec of recs) {
    const href = recommendationHref(rec);
    const all = [...(rec.data.coverImage ? [rec.data.coverImage] : []), ...rec.data.gallery];
    for (const img of all) {
      images.push({ src: img.src, width: img.width, height: img.height, sourceTitle: rec.data.title, sourceHref: href, sourceKind: 'Recommendation', date: rec.data.date });
    }
  }

  for (const log of logs) {
    const href = goalLogHref(log.id);
    const all = [...(log.data.coverImage ? [log.data.coverImage] : []), ...log.data.gallery];
    for (const img of all) {
      images.push({ src: img.src, width: img.width, height: img.height, sourceTitle: log.data.title, sourceHref: href, sourceKind: 'Goal log', date: log.data.date });
    }
  }

  return images.sort((a, b) => b.date.valueOf() - a.date.valueOf());
}
