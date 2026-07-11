import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DefaultAvatarProps {
  profilePhoto?: string | null;
  firstName?: string;
  lastName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function DefaultAvatar({ 
  profilePhoto, 
  firstName = "", 
  lastName = "", 
  size = "md",
  className = "" 
}: DefaultAvatarProps) {
  // Get initials from first name and last name
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  
  // Generate a consistent color based on the name
  const getColorFromName = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Facebook-style colors (softer palette)
    const colors = [
      "hsl(210, 100%, 56%)", // Blue
      "hsl(150, 100%, 40%)", // Green
      "hsl(280, 100%, 50%)", // Purple
      "hsl(30, 100%, 50%)",  // Orange
      "hsl(340, 100%, 50%)", // Pink
      "hsl(190, 100%, 45%)", // Teal
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const backgroundColor = getColorFromName(firstName + lastName);
  
  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`} data-testid="avatar-default">
      {profilePhoto && (
        <AvatarImage 
          src={profilePhoto} 
          alt={`${firstName} ${lastName}`}
          data-testid="avatar-image"
        />
      )}
      <AvatarFallback 
        style={{ backgroundColor }}
        className="text-white font-semibold"
        data-testid="avatar-fallback"
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
