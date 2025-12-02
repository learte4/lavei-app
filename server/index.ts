import express from "express";
import { registerRoutes } from "./routes";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(app);

  const EXPO_DEV_PORT = 8081;
  
  const expoProxy = createProxyMiddleware({
    target: `http://127.0.0.1:${EXPO_DEV_PORT}`,
    changeOrigin: true,
    ws: true,
    on: {
      error: (err, req, res) => {
        if ('writeHead' in res && typeof res.writeHead === 'function') {
          res.writeHead(503, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head><title>Lavei - Aguardando Expo</title></head>
              <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0b100;">
                <div style="text-align: center; color: #071121;">
                  <h1>Lavei</h1>
                  <p>Aguardando o servidor Expo iniciar...</p>
                  <p>Atualize a página em alguns segundos.</p>
                </div>
              </body>
            </html>
          `);
        }
      }
    }
  });

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return expoProxy(req, res, next);
  });

  const port = 5000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Backend API running on http://0.0.0.0:${port}`);
    console.log(`Proxying non-API requests to Expo on port ${EXPO_DEV_PORT}`);
  });
})();
