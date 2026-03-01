import { supabase } from "@/lib/supabase";

export async function uploadScreenshot(file: File): Promise<string> {
  const fileName = `trades/${crypto.randomUUID()}.webp`;

  const { error } = await supabase.storage
    .from("screenshots")
    .upload(fileName, file, { contentType: "image/webp" });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from("screenshots")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteScreenshot(url: string): Promise<void> {
  const path = url.split("/screenshots/")[1];
  if (path) {
    await supabase.storage.from("screenshots").remove([path]);
  }
}
