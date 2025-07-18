
// ===== lib/hono-client.ts =====
import { hc } from "hono/client";
import type { router } from "@/app/api/[[...route]]/routes";

// Base API URL configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Create and export the base Hono client
export const honoClient = hc<router>(API_BASE_URL);

// Export the client type for other modules to use  
export type HonoClient = typeof honoClient;

// Custom error class for API operations
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic response handler utility
export async function handleHonoResponse<T>(
  honoPromise: Promise<Response>
): Promise<T> {
  try {
    const response = await honoPromise;
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error or invalid JSON response', 0, error);
  }
}

// Export error schema type
export type ErrorSchema = {
  error: {
    issues: {
      code: string;
      path: (string | number)[];
      message?: string | undefined;
    }[];
    name: string;
  };
  success: boolean;
};