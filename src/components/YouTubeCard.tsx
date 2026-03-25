interface YouTubeCardProps {
  title: string;
  channel: string;
  date: string;
  url: string;
  score: number;
  views: number;
  likes: number;
  thumbnailUrl: string;
}

export default function YouTubeCard({
  title,
  channel,
  date,
  url,
  score,
  views,
  likes,
  thumbnailUrl,
}: YouTubeCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-zinc-800 rounded-xl overflow-hidden hover:bg-zinc-900/50 transition-colors group"
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="relative w-40 h-[90px] shrink-0 rounded-lg overflow-hidden bg-zinc-800">
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug mb-1">
            {title}
          </h3>
          <p className="text-xs text-zinc-400 mb-1">{channel}</p>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>{date}</span>
            {views > 0 && <span>{views.toLocaleString()} views</span>}
            {likes > 0 && <span>{likes.toLocaleString()} likes</span>}
            <span className="ml-auto font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
              {score}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
