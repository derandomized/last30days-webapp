interface RedditCardProps {
  author: string;
  date: string;
  title: string;
  text: string;
  url: string;
  score: number;
  subreddit?: string;
}

export default function RedditCard({
  author,
  date,
  title,
  text,
  url,
  score,
  subreddit,
}: RedditCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-zinc-800 rounded-xl p-4 hover:bg-zinc-900/50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        {subreddit && (
          <span className="text-xs font-semibold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">
            r/{subreddit}
          </span>
        )}
        <span className="text-xs text-zinc-500">{date}</span>
        <span className="ml-auto text-xs font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
          {score}
        </span>
      </div>
      {title && (
        <h3 className="text-sm font-semibold text-zinc-100 mb-1 line-clamp-2">
          {title}
        </h3>
      )}
      {text && (
        <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed italic">
          {text}
        </p>
      )}
    </a>
  );
}
