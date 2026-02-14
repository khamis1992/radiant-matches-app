/**
 * Sadad Payment Gateway Types
 * Documentation: https://developer.sadad.qa/
 */

export interface SadadPaymentRequest {
  merchant_id: string;
  ORDER_ID: string;
  WEBSITE: string;
  TXN_AMOUNT: string;
  CUST_ID: string;
  EMAIL: string;
  MOBILE_NO: string;
  SADAD_WEBCHECKOUT_PAGE_LANGUAGE: "ENG" | "ARA";
  CALLBACK_URL: string;
  txnDate: string;
  VERSION: string;
  productdetail?: SadadProductDetail[];
  checksumhash: string;
}

export interface SadadProductDetail {
  order_id: string;
  itemname: string;
  amount: string;
  quantity: string;
  type: string;
}

export interface SadadCallbackResponse {
  ORDERID?: string;
  order_id?: string;
  RESPCODE?: string;
  RESPMSG?: string;
  TXNAMOUNT?: string;
  transaction_number?: string;
  checksumhash?: string;
}

export interface SadadVerificationRequest {
  sadadId: string;
  secretKey: string;
  transactionNumber: string;
}

export interface SadadVerificationResponse {
  status: "success" | "error";
  data?: {
    transactionstatus: number;
    amount: number;
    transactionid: string;
    orderid: string;
    message: string;
  };
  error?: string;
}

export type SadadResponseCode =
  | 1 // Success
  | 400 // Pending
  | 402 // Pending confirmation from bank
  | 810; // Failed

export type SadadTransactionStatus =
  | 0 // Cancelled
  | 1 // Pending
  | 2 // Failed
  | 3; // Success

export const SADAD_RESPONSE_CODES = {
  SUCCESS: 1,
  PENDING: 400,
  PENDING_CONFIRMATION: 402,
  FAILED: 810,
} as const;

export const SADAD_TRANSACTION_STATUSES = {
  CANCELLED: 0,
  PENDING: 1,
  FAILED: 2,
  SUCCESS: 3,
} as const;

export interface SadadErrorMapping {
  [key: string]: {
    message: string;
    userMessage: string;
    retryable: boolean;
  };
}

export const SADAD_ERROR_MAP: SadadErrorMapping = {
  "1001": {
    message: "Invalid merchant credentials",
    userMessage: "Payment gateway configuration error. Please contact support.",
    retryable: false,
  },
  "1002": {
    message: "Invalid checksum hash",
    userMessage: "Payment security verification failed. Please try again.",
    retryable: true,
  },
  "1003": {
    message: "Invalid transaction amount",
    userMessage: "Invalid payment amount. Please check your order.",
    retryable: false,
  },
  "1004": {
    message: "Invalid order ID",
    userMessage: "Order not found. Please try again.",
    retryable: false,
  },
  "2001": {
    message: "Transaction failed",
    userMessage: "Payment failed. Please try again or use a different payment method.",
    retryable: true,
  },
  "2002": {
    message: "Insufficient funds",
    userMessage: "Insufficient funds in your account. Please use a different payment method.",
    retryable: false,
  },
  "2003": {
    message: "Card declined",
    userMessage: "Your card was declined. Please try a different card or payment method.",
    retryable: true,
  },
  "2004": {
    message: "Invalid card details",
    userMessage: "Invalid card details. Please check and try again.",
    retryable: true,
  },
  "2005": {
    message: "Expired card",
    userMessage: "Your card has expired. Please use a different card.",
    retryable: false,
  },
  "3001": {
    message: "Transaction timeout",
    userMessage: "Payment timed out. Please try again.",
    retryable: true,
  },
  "3002": {
    message: "Server error",
    userMessage: "Payment server error. Please try again later.",
    retryable: true,
  },
  "ERR": {
    message: "Domain mismatch or checksum error",
    userMessage: "Payment verification failed. Please try again.",
    retryable: true,
  },
  "404": {
    message: "Wrong format or wrong URL",
    userMessage: "Payment configuration error. Please contact support.",
    retryable: false,
  },
};
