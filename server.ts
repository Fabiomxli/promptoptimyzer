import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  // Use port from environment or default to 3000 for AI Studio compatibility
  // Note: Port MUST be 3000 to work in AI Studio preview.
  const PORT = process.env.PORT || 3000;

  // Example API route
  app.get("/api/status", (req, res) => {
    res.json({ status: "running", engine: "Suno Prompt Optimizer v5.5" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (PORT !== "3000") {
      console.warn(`Warning: AI Studio preview only works on port 3000. Current port: ${PORT}`);
    }
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
