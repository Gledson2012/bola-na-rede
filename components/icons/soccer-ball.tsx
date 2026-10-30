export function SoccerBallIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7.5 3.2 2.3-1.2 3.7h-4L8.8 9.8 12 7.5Z" fill="currentColor" fillOpacity="0.18" />
      <path d="m12 7.5 3.2 2.3-1.2 3.7h-4L8.8 9.8 12 7.5Z" />
      <path d="M12 3v4.5" />
      <path d="M19.6 9.2 15.2 9.8" />
      <path d="m17.4 17.4-2.4-3.9" />
      <path d="M6.6 17.4l2.4-3.9" />
      <path d="M4.4 9.2l4.4.6" />
    </svg>
  )
}
