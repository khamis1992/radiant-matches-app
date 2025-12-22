import { z } from "zod";

// Qatar phone number format: +974 followed by 8 digits
// Mobile numbers start with 3, 5, 6, or 7
// Landline numbers start with 4
const QATAR_PHONE_REGEX = /^\+974[3-7]\d{7}$/;

export const qatarPhoneSchema = (errorMessage: string) =>
  z.string()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true; // Allow empty
        const cleaned = val.replace(/[\s-]/g, "");
        return QATAR_PHONE_REGEX.test(cleaned);
      },
      { message: errorMessage }
    );

export const formatQatarPhone = (phone: string | null | undefined): string => {
  if (!phone) return "";
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");
  
  // If it starts with +974, format it nicely
  if (cleaned.startsWith("+974") && cleaned.length === 12) {
    const number = cleaned.slice(4);
    return `+974 ${number.slice(0, 4)} ${number.slice(4)}`;
  }
  
  return phone;
};

export const normalizeQatarPhone = (phone: string): string => {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, "");
  
  // If it doesn't start with +974, add it
  if (!cleaned.startsWith("+974") && cleaned.length === 8) {
    return `+974${cleaned}`;
  }
  
  return cleaned;
};

export const validateQatarPhone = (phone: string): boolean => {
  if (!phone || phone.trim() === "") return true;
  const cleaned = phone.replace(/[\s-]/g, "");
  return QATAR_PHONE_REGEX.test(cleaned);
};
