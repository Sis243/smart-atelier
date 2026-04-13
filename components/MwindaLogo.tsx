import Image from "next/image";

type Props = {
  size?: number;
  rounded?: string;
};

export default function MwindaLogo({ size = 44, rounded = "rounded-2xl" }: Props) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden ${rounded} bg-white ring-1 ring-white/15`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/mwinda.jpg"
        alt="Mwinda Industrie"
        fill
        priority={size >= 40}
        sizes={`${size}px`}
        className="object-contain p-1.5"
      />
    </div>
  );
}
