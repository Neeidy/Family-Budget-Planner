import "dotenv/config";
import express from "express";
import { ENV } from "./env";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
// import { registerOAuthRoutes } from "./oauth";
// import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Bootstrap validation: family auth secrets are required
  if (!ENV.familyPasswordHash || !ENV.familyCookieSecret) {
    console.error("[FATAL] FAMILY_PASSWORD_HASH ve FAMILY_COOKIE_SECRET .env'de zorunlu. Sunucu durduruluyor.");
    process.exit(1);
  }

  const app = express();
  const server = createServer(app);

  // Trust Manus/Cloudflare proxy — required for real client IP in rate limit
  app.set("trust proxy", 1);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: ENV.isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // Body limit: 200KB max (was 50MB)
  app.use(express.json({ limit: "200kb" }));
  app.use(express.urlencoded({ limit: "200kb", extended: true }));

  // Login brute-force protection: max 10 attempts per window
  const loginLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000"),
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX ?? "10"),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn("[login-rate-limit]", req.ip);
      res.status(429).json({ error: "Too many login attempts" });
    },
  });
  app.use("/api/trpc/familyAuth.login", loginLimiter);

  // General tRPC rate limit: max 200 requests per window
  const trpcLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000"),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? "200"),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn("[rate-limit]", req.ip, req.path);
      res.status(429).json({ error: "Too many requests" });
    },
  });
  app.use("/api/trpc", trpcLimiter);

  // Demo mode detection: tag requests from demo.aileplan.uk before
  // tRPC context is created. Hostname check uses the X-Forwarded-Host
  // (set by Cloudflare tunnel) or req.hostname.
  app.use((req, _res, next) => {
    const host = (req.headers["x-forwarded-host"] as string | undefined)
      ?? req.hostname
      ?? "";
    (req as any).isGuestRequest = host.startsWith("demo.aileplan.uk");
    next();
  });

  // registerStorageProxy(app);
  // registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
