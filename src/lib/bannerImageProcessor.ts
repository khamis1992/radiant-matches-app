/**
 * Banner image processor - automatically adjusts images to the correct banner dimensions
 * Target banner aspect ratio: 16:9 (1920x1080 or similar)
 */

const BANNER_ASPECT_RATIO = 16 / 9;
const TARGET_WIDTH = 1920;
const TARGET_HEIGHT = 1080;

interface ProcessedImage {
  file: File;
  previewUrl: string;
}

/**
 * Processes a banner image to fit the correct dimensions
 * - If image is too wide: adds padding top/bottom with blurred background
 * - If image is too tall: adds padding left/right with blurred background
 * - Maintains original image quality while filling the banner space
 */
export const processBannerImage = async (file: File): Promise<ProcessedImage> => {
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
      
      // Set canvas to target dimensions
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;

      // Create blurred background layer
      ctx.filter = "blur(30px)";
      
      if (imgAspectRatio > BANNER_ASPECT_RATIO) {
        // Image is wider than banner - scale by height and center horizontally
        const scale = TARGET_HEIGHT / img.height;
        const scaledWidth = img.width * scale;
        const x = (TARGET_WIDTH - scaledWidth) / 2;
        ctx.drawImage(img, x, 0, scaledWidth, TARGET_HEIGHT);
      } else {
        // Image is taller than banner - scale by width and center vertically
        const scale = TARGET_WIDTH / img.width;
        const scaledHeight = img.height * scale;
        const y = (TARGET_HEIGHT - scaledHeight) / 2;
        ctx.drawImage(img, 0, y, TARGET_WIDTH, scaledHeight);
      }

      // Reset filter and draw the main image on top
      ctx.filter = "none";
      
      // Add a semi-transparent overlay to blend the background
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      // Draw the main image centered with proper aspect ratio
      if (imgAspectRatio > BANNER_ASPECT_RATIO) {
        // Image is wider - fit by width, center vertically
        const scale = TARGET_WIDTH / img.width;
        const scaledHeight = img.height * scale;
        const y = (TARGET_HEIGHT - scaledHeight) / 2;
        ctx.drawImage(img, 0, y, TARGET_WIDTH, scaledHeight);
      } else {
        // Image is taller - fit by height, center horizontally
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
 * Smart banner image processor with edge extension
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
        // Sample colors from top and bottom edges
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
