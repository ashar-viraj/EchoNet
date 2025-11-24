# EchoNet
Offline-friendly open library that brings books, movies, audio, software, and images into one Next.js app. It has search, filters, login/profile, a small chatbot, and a contact form.

## Run Locally
1) `npm install`
2) Create `.env.local` (see variables below).
3) Start Postgres and load the SQL in `schema/` if you want real data.
4) `npm run dev` and open http://localhost:3000.

### Required environment
| Key | Purpose |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Postgres connection for all content and auth tables. |
| `JWT_SECRET`, `EXPIRY_LIMIT_DAYS` | Token signing and expiry for user sessions. |
| `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | Gmail SMTP used by the contact form. |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_SITE_URL` | Model + auth for the chatbot proxy (`/api/chat`). |

## Code Organization (what lives where)
- `pages/` – Next.js routes.
  - `index.js` – landing page with search, category cards, trending lists, and low-data toggle; sends clicks to `/api/track-click`.
  - `text.js`, `audio.js`, `image.js`, `movies.js`, `software.js` – category pages with filters (language/subjects/year), pagination, and open/download buttons. They call `/api/content/*`.
  - `login.js`, `signup.js` – auth flows calling `/api/auth/login` and `/api/auth/signup`.
  - `profile.js` – read/update profile via `/api/profile`, with logout.
  - `_app.js` – global styles, AuthContext (`useAuth`) that loads user from `/api/me`, and mounts the chatbot.
  - `_document.js` – sets base HTML and rustic background.
  - `api/` – server routes (see below).
- `components/`
  - `Chatbot.js` – floating assistant; posts to `/api/chat`, supports resizing and quick prompts.
  - `ContactUs.js` – feedback form that posts to `/api/contact`, shows success/error, warns if email fails.
- `lib/`
  - `db.js` – Postgres pool and query helper with logging.
  - `content-query.js` – shared content lookup with filters (language/subject/year/size/downloads/search), pagination, and cached filters.
  - `auth.js` – small JWT sign/verify helpers and cookie builders.
  - `cookies.js` – request cookie parser.
  - `email.js` – nodemailer transport using Gmail creds.
  - `userStore.js` – user CRUD, SHA-256 hashing, normalizing, and a safe public shape.
- `pages/api/`
  - `auth/login.js`, `auth/logout.js`, `auth/signup.js` – session management, cookies, and last-login tracking.
  - `chat.js` – OpenRouter proxy for the chatbot.
  - `me.js`, `profile.js` – current-user lookup and profile update (needs JWT cookie).
  - `content/*.js` – typed content feeds (texts, audio, movies, image, software) powered by `getFilteredContent`.
  - `search.js` – simple full-text search across titles/descriptions.
  - `top-viewed.js` – top downloads fallback when view counts are absent.
  - `track-click.js`, `top-clicked.js` – click tracking table creator/updater and trending endpoint.
  - `contact.js` – persists feedback to Postgres and sends team + acknowledgement email.
  - `hello.js` – starter Next.js API stub.
- `data/`
  - `featuredBooks.js` – curated classic reads used on `pages/text.js`.
- `schema/` – SQL schemas for content, filters (`filter_tables_schema.sql`), feedback, and users; plus chunked imports.
- `scrap/` – data ingestion helpers (Python) and NDJSON samples for seeding Postgres; see `scrap/README_DB.md`.
- `styles/globals.css` – Tailwind v4 base plus the custom “rustic” theme utilities and shared animations.
- `next.config.mjs`, `eslint.config.mjs`, `jsconfig.json` – project-level config (path alias `@/*` to repo root).
- `public/` – static assets (logo, favicons, etc.).

## API Notes
- All API routes are under `/pages/api`; the frontend uses `fetch`.

## Data and Ingestion
- Database schema for content is in `schema/database_schema.sql`; filters in `schema/filter_tables_schema.sql`; feedback table in `schema/feedback.sql`.
- Real content comes from Archive.org NDJSON files. The import steps are in `scrap/README_DB.md` using `scrap/import_to_db.py` plus the SQL files in `schema/`.
- If Postgres is empty, the category pages will look empty; featured books still show.

## Styling and UX
- Tailwind is imported globally; rustic palette lives in `styles/globals.css`.
- Chatbot and ContactUs are mounted globally so every page keeps support/assistant access.