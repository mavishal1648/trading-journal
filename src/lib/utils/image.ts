import imageCompression from "browser-image-compression";

export async function convertToWebP(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/webp" as const,
  };

  const compressedFile = await imageCompression(file, options);

  const newFileName = file.name.replace(/\.[^.]+$/, ".webp");
  return new File([compressedFile], newFileName, { type: "image/webp" });
}
