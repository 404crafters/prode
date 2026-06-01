import Image from "next/image";

type TeamLabelProps = {
  name: string;
  flagUrl?: string | null;
  className?: string;
  flagClassName?: string;
};

export function TeamLabel({
  className = "",
  flagClassName = "h-5 w-5",
  flagUrl,
  name,
}: TeamLabelProps) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      {flagUrl ? (
        <Image
          alt=""
          className={`shrink-0 rounded-sm object-contain ${flagClassName}`}
          height={24}
          src={flagUrl}
          width={24}
        />
      ) : null}
      <span className="min-w-0 truncate">{name}</span>
    </span>
  );
}
