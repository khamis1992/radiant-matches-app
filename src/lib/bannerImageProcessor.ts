/**
 * Banner image processor - automatically adjusts images to the correct banner dimensions
 * Uses AI to intelligently extend images to fill the banner space
 * Target banner aspect ratio: 16:9 (1920x1080 or similar)
 */

import { supabase } from "@/integrations/supabase/client";

const BANNER_ASPECT_RATIO = 16 / 9;
const TARGET_WIDTH = 1920;
const TARGET_HEIGHT = 1080;

interface ProcessedImage {
  file: File;
  previewUrl: string;
}

/**
 * Convert a File to base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Convert base64 to File
 */
const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

/**
 * Use AI to intelligently extend the image to the correct banner dimensions
 */
export const processBannerImageWithAI = async (file: File): Promise<ProcessedImage> => {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Call the edge function to process with AI
    const { data, error } = await supabase.functions.invoke("extend-banner-image", {
      body: {
        imageBase64: base64,
        aspectRatio: "16:9",
      },
    });

    if (error) {
      console.error("AI processing error:", error);
      throw new Error(error.message || "Failed to process image with AI");
    }

    if (!data?.imageUrl) {
      throw new Error("No processed image returned from AI");
    }

    // Convert the AI-generated base64 back to a File
    const processedFile = base64ToFile(
      data.imageUrl,
      file.name.replace(/\.[^/.]+$/, "_extended.jpg")
    );

    return {
      file: processedFile,
      previewUrl: data.imageUrl,
    };
  } catch (error) {
    console.error("AI image processing failed:", error);
    // Fallback to traditional processing
    return processBannerImageSmooth(file);
  }
};

/**
 * Smart banner image processor with edge extension (fallback method)
 * Creates a seamless extended background using edge colors
 */
export const processBannerImageSmooth = async (file: File): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      const imgAspectRatio = img.width / img.height;
      
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;

      // First, fill with a gradient based on edge colors
      if (imgAspectRatio > BANNER_ASPECT_RATIO) {
        // Wider image - need to fill top and bottom
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          tempCtx.drawImage(img, 0, 0);
          
          // Get average color from top edge
          const topData = tempCtx.getImageData(0, 0, img.width, 1).data;
          const topColor = getAverageColor(topData);
          
          // Get average color from bottom edge
          const bottomData = tempCtx.getImageData(0, img.height - 1, img.width, 1).data;
          const bottomColor = getAverageColor(bottomData);
          
          // Create gradient fill
          const gradient = ctx.createLinearGradient(0, 0, 0, TARGET_HEIGHT);
          gradient.addColorStop(0, topColor);
          gradient.addColorStop(0.5, blendColors(topColor, bottomColor));
          gradient.addColorStop(1, bottomColor);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
        }
        
        // Draw scaled image centered
        const scale = TARGET_WIDTH / img.width;
        const scaledHeight = img.height * scale;
        const y = (TARGET_HEIGHT - scaledHeight) / 2;
        ctx.drawImage(img, 0, y, TARGET_WIDTH, scaledHeight);
      } else {
        // Taller image - need to fill left and right
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          tempCtx.drawImage(img, 0, 0);
          
          // Get average color from left edge
          const leftData = tempCtx.getImageData(0, 0, 1, img.height).data;
          const leftColor = getAverageColor(leftData);
          
          // Get average color from right edge
          const rightData = tempCtx.getImageData(img.width - 1, 0, 1, img.height).data;
          const rightColor = getAverageColor(rightData);
          
          // Create gradient fill
          const gradient = ctx.createLinearGradient(0, 0, TARGET_WIDTH, 0);
          gradient.addColorStop(0, leftColor);
          gradient.addColorStop(0.5, blendColors(leftColor, rightColor));
          gradient.addColorStop(1, rightColor);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
        }
        
        // Draw scaled image centered
        const scale = TARGET_HEIGHT / img.height;
        const scaledWidth = img.width * scale;
        const x = (TARGET_WIDTH - scaledWidth) / 2;
        ctx.drawImage(img, x, 0, scaledWidth, TARGET_HEIGHT);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not process image"));
            return;
          }

          const processedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          const previewUrl = URL.createObjectURL(blob);
          resolve({ file: processedFile, previewUrl });
        },
        "image/jpeg",
        0.92
      );
    };

    img.onerror = () => {
      reject(new Error("Could not load image"));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get average color from image data
 */
function getAverageColor(data: Uint8ClampedArray): string {
  let r = 0, g = 0, b = 0;
  const pixels = data.length / 4;
  
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  
  r = Math.round(r / pixels);
  g = Math.round(g / pixels);
  b = Math.round(b / pixels);
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Blend two colors together
 */
function blendColors(color1: string, color2: string): string {
  const rgb1 = color1.match(/\d+/g)?.map(Number) || [0, 0, 0];
  const rgb2 = color2.match(/\d+/g)?.map(Number) || [0, 0, 0];
  
  const r = Math.round((rgb1[0] + rgb2[0]) / 2);
  const g = Math.round((rgb1[1] + rgb2[1]) / 2);
  const b = Math.round((rgb1[2] + rgb2[2]) / 2);
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Check if an image needs processing (aspect ratio differs significantly)
 */
export const needsProcessing = (width: number, height: number): boolean => {
  const aspectRatio = width / height;
  const difference = Math.abs(aspectRatio - BANNER_ASPECT_RATIO);
  // If difference is more than 10%, suggest processing
  return difference > BANNER_ASPECT_RATIO * 0.1;
};

/**
 * Get image dimensions from a file
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error("Could not load image"));
    };
    img.src = URL.createObjectURL(file);
  });
};
