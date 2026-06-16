export async function fileToBase64(
  file: File
): Promise<{ base64: string; mimeType: string }> {
  const mimeType = file.type === "image/jpg" ? "image/jpeg" : file.type;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Invalid image data"));
        return;
      }
      resolve({ base64, mimeType });
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
