import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Camera, X } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DefaultAvatar } from "@/components/default-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/contexts/wallet-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string | null;
  bio?: string | null;
  website?: string | null;
  twitterUsername?: string | null;
  redditUsername?: string | null;
  githubUsername?: string | null;
}

export default function EditProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isAuthLoading } = useWallet();

  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [twitterUsername, setTwitterUsername] = useState("");
  const [redditUsername, setRedditUsername] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
  });

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setWebsite(profile.website || "");
      setTwitterUsername(profile.twitterUsername || "");
      setRedditUsername(profile.redditUsername || "");
      setGithubUsername(profile.githubUsername || "");
    }
  }, [profile]);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("bio", bio);
      formData.append("website", website);
      formData.append("twitterUsername", twitterUsername);
      formData.append("redditUsername", redditUsername);
      formData.append("githubUsername", githubUsername);
      
      if (selectedImage) {
        formData.append("profilePhoto", selectedImage);
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setLocation("/profile");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const displayName = `${profile.firstName}${profile.lastName}`;
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="border-b border-border sticky top-0 z-50 bg-background">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover-elevate"
              onClick={() => setLocation("/profile")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              <AvatarImage 
                src={previewUrl || profile.profilePhoto || undefined} 
                alt={displayName} 
                data-testid="avatar-preview"
              />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            {/* Change/Remove Photo Buttons */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-change-photo"
              >
                <Camera className="h-4 w-4" />
              </Button>
              {(previewUrl || profile.profilePhoto) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={handleRemoveImage}
                  data-testid="button-remove-photo"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
              data-testid="input-photo"
            />
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <button
              className="text-sm text-primary hover:underline cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-change-profile-photo"
            >
              Change profile photo
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <Textarea
              placeholder="Describe yourself"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[100px]"
              data-testid="input-bio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Your website</label>
            <Input
              type="url"
              placeholder="Add your website address"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              data-testid="input-website"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Twitter username</label>
            <Input
              type="text"
              placeholder="Twitter username"
              value={twitterUsername}
              onChange={(e) => setTwitterUsername(e.target.value)}
              data-testid="input-twitter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reddit username</label>
            <Input
              type="text"
              placeholder="Reddit username"
              value={redditUsername}
              onChange={(e) => setRedditUsername(e.target.value)}
              data-testid="input-reddit"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">GitHub username</label>
            <Input
              type="text"
              placeholder="GitHub username"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              data-testid="input-github"
            />
          </div>

          <Button
            className="w-full"
            onClick={() => updateProfileMutation.mutate()}
            disabled={updateProfileMutation.isPending}
            data-testid="button-save"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
