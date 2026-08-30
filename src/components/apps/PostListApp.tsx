import type { DesktopPost } from '../desktop/types';
import { useOpenDocument } from '../desktop/openDocument';

interface Props {
  posts: DesktopPost[];
  type: 'article' | 'thinkpiece' | 'update';
  emptyLabel: string;
}

export default function PostListApp({ posts, type, emptyLabel }: Props) {
  const filtered = posts.filter((p) => p.type === type);
  const openDocument = useOpenDocument();

  if (filtered.length === 0) {
    return <p className="app-empty">{emptyLabel}</p>;
  }

  return (
    <ul className="app-list">
      {filtered.map((post) => (
        <li key={post.slug}>
          <a href={post.href} onClick={(e) => openDocument(post.href, post.title, e)}>
            {post.coverImageSrc && <img className="app-list-thumb" src={post.coverImageSrc} alt="" />}
            <span className="app-list-body">
              <span className="app-list-title">
                {post.title}
                {post.isNew && <span className="new-tag">NEW!</span>}
              </span>
              <span className="app-list-summary">{post.summary}</span>
              <span className="app-list-date">{post.dateLabel}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
