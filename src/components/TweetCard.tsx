interface TweetCardProps {
  author: string;
  date: string;
  text: string;
  url: string;
  score: number;
  likes: number;
  retweets: number;
}

export default function TweetCard({
  author,
  date,
  text,
  url,
  score,
  likes,
  retweets,
}: TweetCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-zinc-800 rounded-xl p-4 hover:bg-zinc-900/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Avatar placeholder */}
        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-zinc-400">
            <path
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          {/* Author + date */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-zinc-100">{author}</span>
            <span className="text-xs text-zinc-500">{date}</span>
            <span className="ml-auto text-xs font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
              {score}
            </span>
          </div>

          {/* Tweet text */}
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words line-clamp-4">
            {text}
          </p>

          {/* Engagement row */}
          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
            {likes > 0 && (
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {likes}
              </span>
            )}
            {retweets > 0 && (
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 1l4 4-4 4" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <path d="M7 23l-4-4 4-4" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                {retweets}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
