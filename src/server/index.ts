import { Hono } from 'hono'
import { HTTPException } from "hono/http-exception";
import site from "./routes/site";
import section from "./routes/section";
import data from "./routes/data";

const app = new Hono()

app.use("/api/*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  c.header("X-Content-Type-Options", "nosniff");
  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    const origin = c.req.header("Origin");
    if (origin && origin !== new URL(c.req.url).origin)
      throw new HTTPException(403, {
        message: "Cross-origin writes are not allowed.",
      });
  }
  await next();
});

app.get('/api', (c) => {
  return c.text('Hello Hono!')
})


app.route("/api/site", site);
app.route("/api/section", section);
app.route("/api/data", data);

export default app
