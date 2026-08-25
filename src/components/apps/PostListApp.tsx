import type { DesktopPost } from '../desktop/types';

interface Props {
  posts: DesktopPost[];
  type: 'article' | 'thinkpiece' | 'update';
  emptyLabel: string;
}

export default function PostListApp({ posts, type, emptyLabel }: Props) {
  const filtered = posts.filter((p) => p.type === type);

  if (filtered.length === 0) {
    return <p className="app-empty">{emptyLabel}</p>;
  }

  return (
    <ul className="app-list">
      {filtered.map((post) => (
        <li key={post.slug}>
          <a href={post.href}>
            {post.coverImageSrc && <img className="app-list-thumb" src={post.coverImageSrc} alt="" />}
            <span className="app-list-body">
              <span className="app-list-title">{post.title}</span>
              <span className="app-list-summary">{post.summary}</span>
              <span className="app-list-date">{post.dateLabel}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
