interface HNCardProps {
  author: string;
  date: string;
  title: string;
  text: string;
  url: string;
  score: number;
  points?: number;
  comments?: number;
  insights?: string[];
}

export default function HNCard({
  author,
  date,
  title,
  url,
  score,
  points,
  comments,
  insights,
}: HNCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-zinc-800 rounded-xl p-4 hover:bg-zinc-900/50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
          HN
        </span>
        <span className="text-xs text-zinc-500">{author}</span>
        <span className="text-xs text-zinc-500">{date}</span>
        <span className="ml-auto text-xs font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
          {score}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-zinc-100 mb-1 line-clamp-2">
        {title}
      </h3>

      <div className="flex items-center gap-3 text-xs text-zinc-500 mb-2">
        {points !== undefined && points > 0 && <span>{points} points</span>}
        {comments !== undefined && comments > 0 && <span>{comments} comments</span>}
      </div>

      {insights && insights.length > 0 && (
        <div className="mt-2 space-y-1">
          {insights.slice(0, 2).map((insight, i) => (
            <p key={i} className="text-xs text-zinc-500 italic line-clamp-1">
              &ldquo;{insight}&rdquo;
            </p>
          ))}
        </div>
      )}
    </a>
  );
}
