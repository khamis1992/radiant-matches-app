export interface ActivityLogEntry {
  id: string;
  action: string;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Hook for activity logging
 * Note: This feature requires activity_logs table to be created
 */
export const useActivityLog = () => {
  return {
    data: [] as ActivityLogEntry[],
    isLoading: false,
    error: null,
  };
};
