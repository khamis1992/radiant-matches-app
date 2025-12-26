// SADAD Payment Gateway Constants

export const SADAD_STATUS_CODES = {
  SUCCESS: 3,
  FAILED: 2,
  PENDING: 1,
  CANCELLED: 0,
} as const;

export const SADAD_ERROR_CODES = {
  INVALID_MERCHANT: "1001",
  INVALID_CHECKSUM: "1002",
  INVALID_AMOUNT: "1003",
  INVALID_ORDER_ID: "1004",
  TRANSACTION_FAILED: "2001",
  INSUFFICIENT_FUNDS: "2002",
  CARD_DECLINED: "2003",
  INVALID_CARD: "2004",
  EXPIRED_CARD: "2005",
  TIMEOUT: "3001",
  SERVER_ERROR: "3002",
} as const;

export const SADAD_ERROR_MESSAGES = {
  [SADAD_ERROR_CODES.INVALID_MERCHANT]: "Invalid merchant credentials",
  [SADAD_ERROR_CODES.INVALID_CHECKSUM]: "Invalid checksum hash",
  [SADAD_ERROR_CODES.INVALID_AMOUNT]: "Invalid transaction amount",
  [SADAD_ERROR_CODES.INVALID_ORDER_ID]: "Invalid order ID",
  [SADAD_ERROR_CODES.TRANSACTION_FAILED]: "Transaction failed",
  [SADAD_ERROR_CODES.INSUFFICIENT_FUNDS]: "Insufficient funds",
  [SADAD_ERROR_CODES.CARD_DECLINED]: "Card declined by bank",
  [SADAD_ERROR_CODES.INVALID_CARD]: "Invalid card details",
  [SADAD_ERROR_CODES.EXPIRED_CARD]: "Card has expired",
  [SADAD_ERROR_CODES.TIMEOUT]: "Transaction timeout",
  [SADAD_ERROR_CODES.SERVER_ERROR]: "Server error, please try again",
} as const;

export const SADAD_IPS = {
  TEST: ["52.51.150.11", "52.51.150.12"],
  PRODUCTION: ["52.51.150.1", "52.51.150.2"],
} as const;

export const SADAD_ENDPOINTS = {
  TEST: {
    PAYMENT: "https://sadadqa.com/webpurchase",
    VERIFICATION: "https://api.sadadqa.com/api-v4/transactionstatus",
  },
  PRODUCTION: {
    PAYMENT: "https://sadad.com/webpurchase",
    VERIFICATION: "https://api.sadad.com/api-v4/transactionstatus",
  },
} as const;
