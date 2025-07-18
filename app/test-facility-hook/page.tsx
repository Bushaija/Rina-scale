"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function TestQueryPage() {
  const [url, setUrl] = useState("");
  const [shouldFetch, setShouldFetch] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["manual-test", url],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: shouldFetch && !!url,
  });

  const handleTest = () => {
    if (url.trim()) {
      setShouldFetch(true);
    }
  };

  const resetTest = () => {
    setUrl("");
    setShouldFetch(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">🧪 TanStack Query Tester</h1>

        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Request URL:</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter full GET endpoint URL..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={!url.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Fetching..." : "Run Query"}
            </button>
            <button
              onClick={() => refetch()}
              disabled={!shouldFetch || isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refetch
            </button>
            <button
              onClick={resetTest}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Status Section */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <h3 className="font-semibold mb-2">Query Status:</h3>
          <div className="space-y-1 text-sm">
            <div>🔍 <strong>Enabled:</strong> {shouldFetch ? "✅ Yes" : "❌ No"}</div>
            <div>⏳ <strong>Loading:</strong> {isLoading ? "✅ Yes" : "❌ No"}</div>
            <div>🔄 <strong>Fetching:</strong> {isFetching ? "✅ Yes" : "❌ No"}</div>
            <div>❌ <strong>Error:</strong> {isError ? "✅ Yes" : "❌ No"}</div>
          </div>
        </div>

        {/* Result / Error Display */}
        {isLoading && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-700 dark:text-blue-300">Fetching data...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
            <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">❌ Error:</h3>
            <pre className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">
              {(error as Error).message}
            </pre>
          </div>
        )}

        {data && !isLoading && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
            <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">✅ Success - Response Data:</h3>
            <pre className="text-sm text-green-600 dark:text-green-400 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded border overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 