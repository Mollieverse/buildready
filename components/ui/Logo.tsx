type Props = {
  size?: number;
};

export function Logo({ size = 24 }: Props) {
  return (
    <div className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="text-fg"
      >
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0.7"
        />
        <path
          d="M8 8h4.5a3 3 0 0 1 0 6H8V8z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M8 14h5.5a3 3 0 0 1 0 6H8v-6z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-bold tracking-tight text-fg">BuildReady</span>
    </div>
  );
}
