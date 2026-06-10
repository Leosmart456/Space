import logoImage from "@assets/Lumirra Logo Design (original)_1761608943046.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

export function Logo({ className = "", size = "md" }: LogoProps) {
  return (
    <img
      src={logoImage}
      alt="Lumirra"
      className={`${sizes[size]} ${className}`}
      data-testid="img-logo"
    />
  );
}
