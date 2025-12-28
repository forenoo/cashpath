"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";

const getProfileInitials = (
  profile: { name?: string; email?: string } | null | undefined,
) => {
  if (!profile) return "U";
  if (profile.name) {
    const names = profile.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names.at(-1)?.[0] || ""}`.toUpperCase();
    }
    return profile.name.substring(0, 2).toUpperCase();
  }
  if (profile.email) {
    return profile.email.substring(0, 2).toUpperCase();
  }
  return "U";
};

export default function ProfileTab() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    ...trpc.user.getProfile.queryOptions(),
    select: (data) => {
      if (data && name === "") {
        setName(data.name);
        setImageUrl(data.image);
      }
      return data;
    },
  });

  // Cleanup preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const generateUploadUrl = useMutation(
    trpc.storage.generateUploadUrl.mutationOptions(),
  );

  const updateProfile = useMutation(
    trpc.user.updateProfile.mutationOptions({
      onSuccess: () => {
        toast.success("Profil berhasil diperbarui");
        queryClient.invalidateQueries({
          queryKey: trpc.user.getProfile.queryKey(),
        });
        // Clear pending file after successful save
        setPendingFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      },
      onError: (error) => {
        toast.error(`Gagal memperbarui profil: ${error.message}`);
      },
    }),
  );

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diperbolehkan");
      return;
    }

    // Revoke previous preview URL if exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create preview URL and store the pending file
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setPendingFile(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }

    setIsSaving(true);

    try {
      let finalImageUrl = imageUrl;

      // Upload pending file if exists
      if (pendingFile) {
        const { uploadUrl, publicUrl } = await generateUploadUrl.mutateAsync({
          filename: pendingFile.name,
          contentType: pendingFile.type,
        });

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: pendingFile,
          headers: {
            "Content-Type": pendingFile.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Gagal mengunggah gambar");
        }

        finalImageUrl = publicUrl;
        setImageUrl(publicUrl);
      }

      // Update profile
      updateProfile.mutate({
        name: name.trim(),
        image: finalImageUrl,
      });
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Display preview URL if available, otherwise show saved image URL
  const displayImageUrl = previewUrl || imageUrl;

  const hasChanges =
    profile &&
    (name !== profile.name ||
      imageUrl !== profile.image ||
      pendingFile !== null);

  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardHeader className="border-b">
          <div className="space-y-1">
            <CardTitle>Profil Pengguna</CardTitle>
            <CardDescription>
              Kelola informasi profil Anda di sini.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Skeleton className="size-24 rounded-full" />
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="border-b">
        <div className="space-y-1">
          <CardTitle>Profil Pengguna</CardTitle>
          <CardDescription>
            Kelola informasi profil Anda di sini.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Profile Image */}
          <div className="relative">
            <Avatar className="size-24 border-2 border-border">
              <AvatarImage
                src={displayImageUrl || ""}
                alt={profile?.name || "User"}
              />
              <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                {getProfileInitials(profile)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={handleImageClick}
              disabled={isSaving}
              className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Camera className="size-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Form Fields */}
          <div className="w-full flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama Anda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email tidak dapat diubah.
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving || updateProfile.isPending}
              className="w-full sm:w-auto"
            >
              {isSaving || updateProfile.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
