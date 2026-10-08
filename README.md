# Notionic

Notionic is a static blog that updates in real time, synchronizing changes to Notion pages without rebuilding the deployment.

![Notionic](./banner.png)

## Demo

- Notionic: [https://notionic.vercel.app](https://notionic.vercel.app)
- My Blog: [https://zuolan.me](https://zuolan.me)

## Features

- Incremental static regeneration
- Outline
- Theme switch
- Multi-language
- Native style comments
- Loading and transition animation
- Block page support
- SEO and Open Graph optimization
- Newsletter support
- Contact Form
- Telegram bot integration

## Quick Start

- Duplicate [Notionic template](https://zuolan.notion.site/dea4de63b4aa4efb87174591936f0bde), and share it to the public
- [Fork](https://github.com/izuolan/notionic/fork) this project
- **Customize `blog.config.js` file**
- _(Optional)_ Replace `favicon.svg/png/ico` in `public` folder with your own
- Modify `lib/lang.js` with your self introduction
- Deploy on [Vercel](https://vercel.com), [Netlify](https://netlify.com), or [Cloudflare Pages](https://pages.cloudflare.com), set following environment variables：
  - `NOTION_PAGE_ID` (Required): The ID of the Notion page you previously shared to the web, usually has 32 digits after your workspace address
  - eg: `https://your-username.notion.site/<NOTION_PAGE_ID>?v=<view_id>`
  - `NOTION_SPACES_ID` (Optional): Your Notion workspace ID
  - `NOTION_ACCESS_TOKEN` (Optional): Token for private Notion pages
  - `TELEGRAM_TOKEN` (Optional): Telegram bot token for share button
  - `DATABASE_URL` (Optional): PostgreSQL URL for Fuma Comment system (only needed if you use comments)
  - `GITHUB_ID` / `GITHUB_SECRET` / `NEXTAUTH_SECRET` (Optional): GitHub OAuth for comment login (only needed if you use comments)

### Netlify Deployment

This project includes a `netlify.toml` configuration file. To deploy to Netlify:

1. Push your code to GitHub
2. Sign up at [Netlify](https://netlify.com) and click "Add new site" → "Import an existing project"
3. Select your GitHub repository
4. Netlify will auto-detect the `netlify.toml` configuration
5. Set the required environment variables in Netlify Dashboard → Site settings → Environment variables
6. Click "Deploy site"

Make sure `DATABASE_URL` (if using comments) points to a publicly accessible PostgreSQL instance that Netlify can reach at runtime.

More details about Notionic deployment:

- [English](https://zuolan.me/en/notionic_en)
- [中文](https://zuolan.me/notionic)

## Development

```bash
# Init
pnpm install
# Develop
./dev.sh
# Build & Serve
pnpm build
pnpm start
```

## Reference & License

- [Notion-X](https://github.com/NotionX/react-notion-x)
- [Nobelium](https://github.com/craigary/nobelium)
- [NotionNext](https://github.com/tangly1024/NotionNext)

The MIT License.
