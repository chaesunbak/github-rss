const express = require("express");
const cors = require("cors");
const Parser = require("rss-parser");
require("dotenv").config();

// --- App Setup ---
const app = express();
const parser = new Parser({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
    Accept:
      "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7",
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve static files from 'public' directory

// --- Constants and Helpers (Defined BEFORE use in /svg) ---
const SVG_WIDTH = 400;
const SVG_DEFAULT_HEIGHT_PER_POST = 40;
const SVG_PADDING = 15;
const SVG_LINE_HEIGHT = 18;
const SVG_TITLE_FONT_SIZE = 14;
const SVG_DATE_FONT_SIZE = 12;

function escapeXml(unsafe) {
  if (typeof unsafe !== "string") return "";
  return unsafe.replace(/[<>&'\""]/g, function (c) {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      case '"':
        return "&quot;"; // Handle curly double quotes
      default:
        return c;
    }
  });
}

// --- Routes ---

// Root route ('/') is now handled by express.static serving public/index.html

// SVG generation endpoint
app.get("/svg", async (req, res) => {
  try {
    const { url, count } = req.query;
    if (!url) return res.status(400).send("RSS URL is required");

    let postCount = 5;
    if (count) {
      const parsedCount = parseInt(count, 10);
      if (!isNaN(parsedCount) && parsedCount > 0) postCount = parsedCount;
    }

    const feed = await parser.parseURL(url);
    const posts = feed.items.slice(0, postCount);

    const svgHeight =
      SVG_PADDING * 2 + posts.length * SVG_DEFAULT_HEIGHT_PER_POST;
    let currentY = SVG_PADDING + SVG_TITLE_FONT_SIZE;

    const postElements = posts
      .map((post) => {
        const title = escapeXml(post.title || "No Title");
        const pubDate = post.pubDate
          ? new Date(post.pubDate).toLocaleDateString()
          : "";
        const postY = currentY;
        currentY += SVG_DEFAULT_HEIGHT_PER_POST;
        return `
            <text x="${SVG_PADDING}" y="${postY}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji" font-size="${SVG_TITLE_FONT_SIZE}px" fill="#0366d6">
                ${title}
            </text>
            <text x="${SVG_PADDING}" y="${
          postY + SVG_LINE_HEIGHT
        }" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji" font-size="${SVG_DATE_FONT_SIZE}px" fill="#586069">
                ${pubDate}
            </text>
        `;
      })
      .join("\n");

    const svg = `
        <svg width="${SVG_WIDTH}" height="${svgHeight}" viewBox="0 0 ${SVG_WIDTH} ${svgHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>/* CSS if needed */</style>
            <rect x="0.5" y="0.5" width="${SVG_WIDTH - 1}" height="${
      svgHeight - 1
    }" rx="4.5" fill="#fff" stroke="#e1e4e8"/> 
            ${postElements}
        </svg>
    `;
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
    res.send(svg);
  } catch (error) {
    console.error("Error generating SVG content:", error);
    const errorSvg = `<svg width="100" height="20" xmlns="http://www.w3.org/2000/svg"><text x="5" y="15" font-family="sans-serif" font-size="10" fill="red">Error</text></svg>`;
    res.setHeader("Content-Type", "image/svg+xml");
    res.status(500).send(errorSvg);
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
