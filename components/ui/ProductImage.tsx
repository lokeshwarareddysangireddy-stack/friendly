import Image from "next/image";
import { cn } from "@/lib/utils";

const PALETTES = [
  "from-[#e8f7dd] to-[#c9ecb4]",
  "from-[#fef3c7] to-[#fde68a]",
  "from-[#dbeafe] to-[#bfdbfe]",
  "from-[#fce7f3] to-[#fbcfe8]",
  "from-[#dcfce7] to-[#bbf7d0]",
  "from-[#ffedd5] to-[#fed7aa]",
];

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function ProductImage({
  src,
  alt,
  seed,
  className,
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
  rounded = "rounded-2xl",
}: {
  src?: string | null;
  alt: string;
  seed?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  rounded?: string;
}) {
  const palette = PALETTES[hashString(seed || alt) % PALETTES.length];

  if (src) {
    return (
      <span className={cn("relative block overflow-hidden", rounded, className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.02]"
          loading={priority ? "eager" : "lazy"}
        />
      </span>
    );
  }

  const initials = alt
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <span
      role="img"
      aria-label={alt}
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        palette,
        rounded,
        className
      )}
    >
      <span className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_25%_20%,#ffffff_0,transparent_45%)]" />
      <span className="relative font-display text-2xl font-extrabold text-forest/70">
        {initials}
      </span>
    </span>
  );
}
