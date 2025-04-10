# GitHub Profile RSS SVG Generator

This service fetches recent posts from a blog's RSS feed and generates an SVG image displaying the post titles and dates. This is useful for embedding in GitHub profile READMEs.

## Usage

**Endpoint:** `/svg?url=<RSS_FEED_URL>&count=<NUMBER_OF_POSTS>`

**Parameters:**

- `url` (required): The URL of the RSS feed. **Remember to URL-encode this parameter.** (e.g., `https://example.com/rss` becomes `https%3A%2F%2Fexample.com%2Frss`)
- `count` (optional): The number of recent posts to display. Defaults to 5.

**How to Encode URL:**

You can use online URL encoders like [urlencoder.org](https://www.urlencoder.org/) or browser console functions (`encodeURIComponent("YOUR_URL")`).

**Embedding in GitHub Profile:**

1.  Deploy this service to a public host like Vercel.
2.  Get your deployed service URL (e.g., `https://your-app.vercel.app`).
3.  URL-encode your blog's RSS feed URL.
4.  Add the following Markdown to your GitHub profile `README.md`, replacing the placeholders:

```markdown
<a href="YOUR_BLOG_URL" target="_blank">
  <img src="YOUR_DEPLOYED_URL/svg?url=YOUR_ENCODED_RSS_URL&count=5" alt="Recent Blog Posts" />
</a>
```

**Example Markdown:**

```markdown
<a href="https://chaesunbak.tistory.com" target="_blank">
  <img src="https://github-rss-example.vercel.app/svg?url=https%3A%2F%2Fchaesunbak.tistory.com%2Frss&count=5" alt="Recent Blog Posts from chaesunbak.tistory.com" />
</a>
```

**Note:** While this displays the posts as an image, the individual post titles within the SVG image will **not** be clickable links due to limitations when embedding SVGs via `<img>` tags in Markdown.

## Development & Deployment

- Run `npm install` to install dependencies.
- Run `npm run dev` for local development (requires Node.js).
- The project is pre-configured for deployment on Vercel (push to a Git repo and import into Vercel).
