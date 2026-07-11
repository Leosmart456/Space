import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      // Real-time updates are driven by WebSocket invalidations.
      // refetchInterval is disabled globally; the WS manager starts a 30s
      // polling fallback automatically when the socket is disconnected.
      refetchInterval: false,
      // Keep existing data visible during background re-fetches so users never
      // see a loading skeleton when their data is simply being refreshed.
      // Use isLoading (not isFetching) in components to gate skeleton states.
      refetchOnWindowFocus: true,
      // staleTime: 0 means data is always eligible for a background refetch
      // when a component mounts or the window is focused, but only if there
      // are active subscribers.  This gives us silent background refresh
      // without any loading-state flicker because TanStack Query serves the
      // cached data immediately and refetches in the background.
      staleTime: 0,
      // Never throw on network errors — show stale data instead
      retry: false,
      // Return existing data while background refetch is in flight so the UI
      // never reverts to a loading state during re-validates.
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      retry: false,
    },
  },
});
