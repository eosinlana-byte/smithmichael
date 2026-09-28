# Smith Michael personal website

Full-stack Node and Express site with PostgreSQL contact enquiries and a protected admin page.

Admin username: `merlin`

## Local setup

1. Copy `.env.example` to `.env`.
2. Add your own `DATABASE_URL` and `ADMIN_PASSWORD` locally. Never commit `.env`.
3. Run `npm install`.
4. Run `node server.js`.
5. Open `http://localhost:3000`.

## Render

Runtime: Node
Build command: `npm install`
Start command: `node server.js`

Add `DATABASE_URL` and `ADMIN_PASSWORD` in Render Environment. Do not paste either secret into chat.

## Video files

Put the supplied clips here:

- `public/assets/video/hero-4k.mp4`
- `public/assets/video/hero-720.mp4`

The site already uses `hero-poster.jpg` when a clip is missing. The responsive video source uses 720p on small screens and 4K on larger screens. Use a licensed, watermark-free coding clip.
