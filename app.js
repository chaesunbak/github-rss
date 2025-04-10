const express = require("express");
const cors = require("cors");
const Parser = require("rss-parser");
require("dotenv").config();

const app = express();
// Configure the parser with custom headers
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

// RSS 피드를 파싱하는 엔드포인트
app.get("/api/rss", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "RSS URL is required" });
    }

    const feed = await parser.parseURL(url);
    const posts = feed.items.map((item) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      content: item.contentSnippet,
    }));

    res.json(posts);
  } catch (error) {
    console.error("Error parsing RSS feed:", error);
    res.status(500).json({ error: "Failed to parse RSS feed" });
  }
});

// SVG 생성을 위한 설정
const SVG_WIDTH = 400;
const SVG_DEFAULT_HEIGHT_PER_POST = 40; // 포스트당 기본 높이
const SVG_PADDING = 15;
const SVG_LINE_HEIGHT = 18;
const SVG_TITLE_FONT_SIZE = 14;
const SVG_DATE_FONT_SIZE = 12;

// Helper function to escape XML/SVG special characters
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'""]/g, function (c) {
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
    }
  });
}

// Generate SVG for blog posts
app.get("/svg", async (req, res) => {
  try {
    const { url, count } = req.query;

    if (!url) {
      return res.status(400).send("RSS URL is required");
    }

    let postCount = 5;
    if (count) {
      const parsedCount = parseInt(count, 10);
      if (!isNaN(parsedCount) && parsedCount > 0) {
        postCount = parsedCount;
      }
    }

    const feed = await parser.parseURL(url);
    const posts = feed.items.slice(0, postCount);

    // Calculate SVG height dynamically
    const svgHeight =
      SVG_PADDING * 2 + posts.length * SVG_DEFAULT_HEIGHT_PER_POST;

    let currentY = SVG_PADDING + SVG_TITLE_FONT_SIZE; // Start Y position for the first title

    const postElements = posts
      .map((post) => {
        const title = escapeXml(post.title || "No Title");
        const pubDate = post.pubDate
          ? new Date(post.pubDate).toLocaleDateString()
          : "";
        const postY = currentY;
        currentY += SVG_DEFAULT_HEIGHT_PER_POST; // Increment Y for the next post

        // Note: Links within SVG embedded via <img> often don't work.
        // We are creating text elements only.
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
            <svg 
                width="${SVG_WIDTH}" 
                height="${svgHeight}" 
                viewBox="0 0 ${SVG_WIDTH} ${svgHeight}" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
            >
                <style>
                    /* You can add basic styles here if needed */
                </style>
                <rect 
                    x="0.5" 
                    y="0.5" 
                    width="${SVG_WIDTH - 1}" 
                    height="${svgHeight - 1}" 
                    rx="4.5" 
                    fill="#fff" 
                    stroke="#e1e4e8"
                /> 
                ${postElements}
            </svg>
        `;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate"); // Prevent caching
    res.send(svg);
  } catch (error) {
    console.error("Error generating SVG content:", error);
    // Return a simple error SVG
    const errorSvg = `
            <svg width="100" height="20" xmlns="http://www.w3.org/2000/svg">
                <text x="5" y="15" font-family="sans-serif" font-size="10" fill="red">Error</text>
            </svg>`;
    res.setHeader("Content-Type", "image/svg+xml");
    res.status(500).send(errorSvg);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
