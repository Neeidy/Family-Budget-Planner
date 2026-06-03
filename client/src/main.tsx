import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import "./i18n";

// Hostname-aware browser tab title.
// Demo subdomain shows a portfolio-friendly English title;
// production keeps the existing Turkish title from index.html.
if (
  typeof window !== "undefined" &&
  window.location.hostname === "demo.aileplan.uk"
) {
  document.title = "Family Budget OS — Live demo";
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on UNAUTHORIZED — auth gate in App.tsx handles redirects
      retry: (failureCount, error) => {
        if (
          error instanceof TRPCClientError &&
          error.data?.code === "UNAUTHORIZED"
        ) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Log non-auth errors for debugging
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED")
      return;
    console.error("[API Query Error]", error);
  }
});
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED")
      return;
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// PWA Service Worker — devre dışı (gerçek sw.js yok, SPA fallback
// index.html dönüyor → MIME error). Tekrar etkinleştirmeden önce
// public/sw.js eklenmesi lazım.

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
