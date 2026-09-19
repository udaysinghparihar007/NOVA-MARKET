import { cn } from '@/lib/utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-slate-950 shadow-lg shadow-blue-500/20',
        className
      )}
    >
      <span className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-blue-500/40 blur-md" />
      <svg viewBox="0 0 32 32" className="relative h-6 w-6" fill="none">
        <path
          d="M8 23V9h3.8l7.4 8.8V9H23v14h-3.7l-7.5-8.8V23H8Z"
          fill="white"
        />
        <path d="M21 9h3v3h-3z" fill="#60A5FA" />
      </svg>
    </span>
  );
}
