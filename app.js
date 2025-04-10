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

// iframe을 위한 HTML 엔드포인트
app.get("/embed", async (req, res) => {
  try {
    const { url, count } = req.query;

    if (!url) {
      return res.status(400).send("RSS URL is required");
    }

    // Parse count, default to 5 if not provided or invalid
    let postCount = 5;
    if (count) {
      const parsedCount = parseInt(count, 10);
      if (!isNaN(parsedCount) && parsedCount > 0) {
        postCount = parsedCount;
      }
    }

    const feed = await parser.parseURL(url);
    const posts = feed.items.slice(0, postCount); // Use postCount

    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background: transparent;
                    }
                    .post-list {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }
                    .post-item {
                        margin-bottom: 15px;
                        padding: 10px;
                        border-bottom: 1px solid #eee;
                    }
                    .post-title {
                        font-size: 14px;
                        margin: 0 0 5px 0;
                    }
                    .post-title a {
                        color: #0366d6;
                        text-decoration: none;
                    }
                    .post-title a:hover {
                        text-decoration: underline;
                    }
                    .post-date {
                        font-size: 12px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <ul class="post-list">
                    ${posts
                      .map(
                        (post) => `
                        <li class="post-item">
                            <h3 class="post-title">
                                <a href="${post.link}" target="_blank">${post.title}</a>
                            </h3>
                            <div class="post-date" data-pubdate="${post.pubDate}"></div>
                        </li>
                    `
                      )
                      .join("")}
                </ul>
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        const dateElements = document.querySelectorAll('.post-date[data-pubdate]');
                        dateElements.forEach(el => {
                            try {
                                const pubDate = el.getAttribute('data-pubdate');
                                if (pubDate) {
                                    // Use browser's default locale
                                    el.textContent = new Date(pubDate).toLocaleDateString();
                                }
                            } catch (e) {
                                console.error('Error formatting date:', e);
                                // Optionally leave the element empty or show the original string
                                // el.textContent = el.getAttribute('data-pubdate'); 
                            }
                        });
                    });
                </script>
            </body>
            </html>
        `;

    res.send(html);
  } catch (error) {
    console.error("Error generating iframe content:", error);
    res.status(500).send("Failed to generate iframe content");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
