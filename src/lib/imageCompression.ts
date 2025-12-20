/**
 * Compresses an image file to reduce file size while maintaining quality
 */
export const compressImage = (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw image with high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not compress image"));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Could not load image"));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Rotates an image by 90 degrees clockwise
 */
export const rotateImage = (file: File): Promise<{ file: File; previewUrl: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      // Swap width and height for 90 degree rotation
      canvas.width = img.height;
      canvas.height = img.width;

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Rotate 90 degrees clockwise
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not rotate image"));
            return;
          }

          const rotatedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          const previewUrl = URL.createObjectURL(blob);
          resolve({ file: rotatedFile, previewUrl });
        },
        "image/jpeg",
        0.9
      );
    };

    img.onerror = () => {
      reject(new Error("Could not load image"));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Formats bytes to human-readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
