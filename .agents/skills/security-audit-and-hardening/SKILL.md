---
name: security-audit-and-hardening
description: "Comprehensive security audit and hardening guide. Covers OWASP Top 10 defense, secrets scanning, rate limiting, security headers, authentication & role authorization, CORS enforcement, and parameterized DB access."
---

# Security Audit and Hardening Guide

Use this skill whenever building, reviewing, or hardening backend and frontend services against security vulnerabilities, sensitive data leakage, and unauthorized access.

## 1. Secrets & Sensitive File Exposure
- **Git Secrets Check**: Run `git status` and scan repository files for `.env`, private keys (`.pem`, `.key`), service account tokens, or hardcoded API keys.
- **Gitignore Rules**: Ensure `.gitignore` explicitly ignores:
  ```gitignore
  .env
  .env.*
  !.env.example
  *.pem
  *.key
  *.cert
  credentials.json
  ```
- **Client Bundles**: Ensure client-side Vite/React code never references server-only environment variables (only `VITE_` prefixed public keys like Clerk Publishable Keys).

## 2. Security Headers (Helmet)
Always integrate `helmet` with modern defaults to protect against clickjacking, MIME-sniffing, and cross-site scripting:
```ts
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: false, // Customized when external proxies (like Clerk) are used
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
```

## 3. Rate Limiting (Brute-Force & DoS Mitigation)
Enforce rate limiting on all API routes to prevent automated credential stuffing and resource exhaustion:
```ts
import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded. Please try again later." },
});
app.use("/api", apiLimiter);
```

## 4. Authentication & Authorization (Admin Protection)
- **Session Verification**: Verify tokens cryptographically on every request via Clerk middleware.
- **Role Verification**: Look up user in database `staff_members` table and verify active status and admin role.
- **Strict Default Deny**: Route files must register `requireCollatAdmin` (or appropriate role middleware) before business endpoints:
  ```ts
  router.use(healthRouter);       // Public
  router.use(requireCollatAdmin); // Protected
  router.use(clientsRouter);
  router.use(documentsRouter);
  ```

## 5. Input Validation & Parameterized Queries (OWASP A03: Injection)
- **Zod Schema Validation**: Validate all request payloads (`req.body`, `req.query`, `req.params`) against strict Zod schemas before running business logic.
- **Safe ORM Queries**: Always use Drizzle ORM query builders (`eq()`, `and()`, `inArray()`). Never concatenate user input into raw SQL strings.

## 6. Cross-Origin Resource Sharing (CORS)
- Avoid indiscriminate `origin: true` with `credentials: true`.
- Validate incoming origins against an explicit regex whitelist (localhost, verified app domains).

## 7. Payload & Buffer Protection
- Limit JSON request body sizes: `express.json({ limit: "1mb" })` to prevent memory exhaustion attacks.
