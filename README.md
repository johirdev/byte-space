# ByteSpace — Online Course Marketplace

> **Frontend assessment for Doin Tech Limited.**
> The brief was to turn the ByteSpace Figma designs into a working website. I built every screen in the brief, then kept going — adding a real backend, an admin panel, and the features a course-selling platform actually needs to run.

ByteSpace connects **verified creators** who teach with **learners** who want practical skills. Learners browse, buy and track courses; creators apply and get verified; admins run everything from one dashboard.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · MongoDB + Mongoose · JWT auth · Zustand · Motion · Swiper · imgbb

---

## 🔑 Admin access (for reviewers)

| | |
|---|---|
| **Admin panel** | [`/dashboard`](http://localhost:3000/dashboard) — locally `http://localhost:3000/dashboard` |
| **Email** | `admin@gmail.com` |
| **Password** | `12345678` |

> ⚠️ These are demo credentials for the assessment only. Change the password (Dashboard → My account) before this goes anywhere public.

**First time in the dashboard?** Two one-click buttons fill the site with demo content:
- **Courses → “Load demo data”** — 12 categories, 18 courses and sample reviews.
- **Testimonials → “Load the 3 design samples”** — the testimonials from the Figma file.

The FAQ section seeds 13 default questions by itself the first time it loads.

---

## ✨ Highlights — what I added beyond the brief

The brief covered the design screens. These are the things I built on top, on my own initiative:

| Feature | What it does |
|---|---|
| 🛒 **Cart & checkout** | Add many courses to a cart (Zustand, persisted, synced across tabs) and buy them in one checkout. Demo payments by **card, bKash, Nagad, Rocket or PayPal** — with Luhn validation, expiry checks and masked card numbers. Prices are always re-calculated on the server. |
| 👤 **Learner accounts** | Register / login with **JWT in httpOnly cookies** (access + refresh tokens, silent refresh, 5-try lockout). |
| 🎓 **Learner profile** | My Courses with progress bars, order receipts, my reviews, and settings (photo upload to imgbb, bio, password). |
| ✅ **Real lesson progress** | Enrolled learners tick lessons; progress is saved to their account. |
| ⭐ **Real reviews** | Only enrolled learners can review, once per course. Ratings recalculate automatically. |
| 🧑‍🏫 **Become a Creator flow** | Application form → admin review (approve / reject with a note) → **verified creator with a Creator ID**. 5-minute cooldown between applications. Verified creators see a creator-style profile instead of the learner one. |
| 🔎 **Creator picker in the course editor** | Search verified creators by name, email or Creator ID; picking one fills the course's creator block and keeps it in sync. |
| ✨ **“AI auto-fill” for courses** | Pick a category and the editor drafts the subtitle, description, key points, full curriculum, price and creator copy. |
| 🔍 **Live hero search** | Debounced search with a results dropdown and keyboard navigation, straight from the home hero. |
| 💬 **Testimonials & FAQ (CMS)** | Both are editable from the dashboard with animated reordering; the FAQ ships with platform-specific defaults and SEO structured data. |
| ℹ️ **About & Contact pages** | Designed to match the site; the contact form opens the visitor's email app pre-filled (no fake “sent”). |
| 🎬 **Motion everywhere** | Hero entrance sequence with counting numbers and mouse parallax, spring-in 3D shapes, scroll reveals, a navbar that turns solid, hides on scroll-down and shows reading progress. All of it respects *reduce motion*. |
| ⏳ **Brand loader & 404** | A branded loader for page transitions and the dashboard, plus the designed 404 page. |
| 📊 **Admin dashboard** | A complete admin panel — see [Admin panel](#-admin-panel) below. |

---

## 🎨 Pages from the brief

Every screen from the Figma file, built to the 1440px frames and responsive down to mobile:

| Page | Route | Notes |
|---|---|---|
| **Home / landing** | `/` | Hero, Trusted Brands slider, Discover Your Passion (category chips + course grid), Learning Paths, Professional Growth, Unlock Your Potential, Testimonials, FAQ |
| **Course search** | `/courses` | Search, filter (price, rating), level, category, sort, category chips and pagination — all synced to the URL |
| **Course details — About** | `/courses/[slug]` | Hero, video preview, side card, description, sneak peek, key points |
| **Course details — Lessons** | `/courses/[slug]#lessons` | Modules, expandable lessons, progress tracking |
| **Course details — Reviews** | `/courses/[slug]#reviews` | Rating summary, star filter, “load more” |
| **Creator profile** | `/creator-profile/[slug]` | Creator hero, follow button (demo), their courses with filters |
| **Login** | `/login` | |
| **Register** | `/register` | Only name, email and password needed |
| **404** | any unknown URL | |

**Pages I added:** `/cart`, `/checkout`, `/profile`, `/become-creator`, `/creator-profile` (all creators), `/about`, `/contact`.

---

## 🗂️ Folder architecture

```
src/
├── app/                          # Next.js App Router
│   ├── (site)/                   # Public site (shared Navbar + Footer)
│   │   ├── page.tsx              #   Home
│   │   ├── courses/  cart/  checkout/  profile/
│   │   ├── creator-profile/  become-creator/  about/  contact/
│   │   └── loading.tsx           #   Brand loader
│   ├── (auth)/                   # Login & register (full-screen, no navbar)
│   ├── dashboard/                # Admin panel (its own layout & auth)
│   ├── api/v1/                   # REST API (route handlers)
│   ├── models/                   # Mongoose schemas
│   ├── services/                 # Business logic — routes stay thin
│   ├── lib/                      # Auth, validation, errors, DB, imgbb, API client
│   ├── types/                    # Shared TypeScript types (API ⇄ UI)
│   ├── not-found.tsx             # 404
│   └── globals.css               # Design tokens (colours, type, grid)
├── Components/
│   ├── Frontend/                 # Public-site pages, cards and shared UI
│   ├── Dashboard/                # Admin screens + reusable admin kit
│   └── Shared/                   # Used by both (e.g. BrandLoader)
├── Layout/                       # Navbar, Footer, providers, dashboard chrome
├── store/                        # Zustand stores (cart, auth, follow)
├── hooks/                        # Data hooks (admin resource, cart sync)
├── config/                       # Env config + site contact details
├── assets/                       # Design images and 3D shapes
└── fonts/                        # Poppins + Satoshi
```

**How the pieces fit:** a page component calls `/api/v1/...` → the route handler checks auth and hands off to a **service** → the service validates input and talks to **MongoDB** through a **model**. The same TypeScript types are shared by the API and the UI, so a change in one shows up as a type error in the other.

---

## 🖥️ Frontend

- **Design system first.** Colours, typography (Poppins headings, Satoshi body) and the 12-column / 1200px grid live as Tailwind v4 tokens in `globals.css`, taken from the Figma style guide.
- **Server + client split.** Sections that only show data (Discover Your Passion, Testimonials, FAQ) render on the server for speed and SEO; interactive parts (search, cart, filters, sliders) are client components.
- **State.** Zustand for the cart (persisted to `localStorage`, cross-tab sync), the learner session and follows.
- **Images.** Uploads go to **imgbb** through the server, so the API key never reaches the browser.
- **Accessibility.** Keyboard-friendly menus, dropdowns and sliders; proper labels and ARIA states; *reduce motion* respected everywhere.

---

## 🛠️ Admin panel

Open **`/dashboard`** and sign in. Roles: **superadmin** (everything), **admin**, **editor** (content), **view only** (read-only).

| Area | What you can do |
|---|---|
| **Overview** | Courses, students, revenue, enrollments, average rating, category breakdown, top-rated courses, latest reviews and orders |
| **Courses** | Search, filter by category / level / status, sort, paginate; publish or unpublish and feature with one click; view, edit, delete |
| **Course editor** | Category-aware **AI auto-fill**, image and gallery upload (imgbb), curriculum builder (modules → lessons, reorder, preview lessons), **verified-creator picker**, completeness checklist, live card preview, unsaved-changes warning |
| **Categories** | Create, edit, order, hide; categories that still have courses can't be deleted |
| **Reviews** | Moderate all reviews — approve, hide, edit, delete; filter by course, rating and status |
| **Creator requests** | Review applications with every detail; **approve** (creates a verified creator with a Creator ID) or **reject** with a note the applicant can see |
| **Verified creators** | Search by name, email or Creator ID; edit (changes flow into every linked course), activate or deactivate, remove |
| **Testimonials** | Create, edit, reorder (animated), show or hide — the home slider updates instantly |
| **FAQs** | Create, edit, reorder, show or hide by category; restore the default questions |
| **Students** | Search, see each learner's courses, orders and reviews; suspend or reactivate; delete |
| **Orders** | Revenue stats, search, filter by status and payment method, order details; **refund** (removes access) |
| **Enrollments** | Who is enrolled in what, with progress |
| **Admin management** | *(superadmin)* Create, edit, deactivate and delete admin accounts and roles |
| **My account** | Update your own profile and password |

---

## 🔌 API

All endpoints live under **`/api/v1`** and return `{ success, message, data, meta?, errors? }`. Field-level `errors` let forms highlight exactly what's wrong.

| Group | Endpoints |
|---|---|
| **Courses** | `GET/POST /courses` (search, filter, sort, paginate) · `GET/PATCH/DELETE /courses/:idOrSlug` · `GET /courses/:id/reviews` · `POST /courses/autofill` · `POST /courses/seed` |
| **Categories** | `GET/POST /course-categories` · `GET/PATCH/DELETE /course-categories/:id` |
| **Reviews (admin)** | `GET/POST /course-reviews` · `PATCH/DELETE /course-reviews/:id` |
| **Learner auth** | `POST /users/register` · `/users/login` · `/users/logout` · `/users/refresh` |
| **Learner account** | `GET/PATCH /users/me` · `PATCH /users/me/password` · `POST/DELETE /users/me/avatar` · `/users/me/enrollments` · `/users/me/orders` · `/users/me/reviews` |
| **Checkout** | `POST /checkout` |
| **Creators** | `GET /creators` · `GET /creators/:slug` · `/creator-applications` (+ `/me`, `/upload`, `/:id`) · `/verified-creators` (+ `/search`, `/:id`) |
| **Site content** | `/testimonials` (+ `/reorder`, `/seed`) · `/faqs` (+ `/reorder`, `/restore-defaults`) |
| **Admin** | `/admins` (+ `/login`, `/logout`, `/refresh`, `/me`) · `/users` · `/orders` · `/enrollments` · `/dashboard/stats` · `/upload` |

**Security basics:** passwords hashed with bcrypt; learner and admin tokens are signed with different secrets so one can never pass as the other; role checks on every write; hidden content is only visible to real admins; open-redirect-safe login redirects.

---

## 🚀 Getting started

**Requirements:** Node.js 20+, a MongoDB database, and an [imgbb](https://api.imgbb.com/) API key.

```bash
git clone https://github.com/johirdev/byte-space.git
cd byte-space
npm install
```

Create a `.env` file in the project root:

```env
DATABASE_URL=mongodb+srv://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN_ADMIN=1d
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUND=12
IMGBB_API_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Then run:

```bash
npm run dev      # http://localhost:3000
```

On an empty database, the first admin account you create becomes the **superadmin**.

---

## 📝 Notes

- **Payments are a demo.** Nothing is charged; card `4242 4242 4242 4242` succeeds and `4000 0000 0000 0002` is declined.
- **“AI auto-fill” is template-based.** There's no LLM key in the project, so it uses category-aware templates. It lives in one function (`services/courseAutofill.service.ts`) and can be swapped for a real model without touching the UI.
- **Follow and follower counts are demo only.** Follows are saved in the browser.
- **Known issue:** `src/app/lib/pageData.ts` and `src/Components/Dashboard/Profile/ProfileSettings.tsx` are leftovers from an earlier template and still have TypeScript errors, so `next build` fails until they're fixed or removed. `npm run dev` works normally.

---

Built by [**@johirdev**](https://github.com/johirdev) for the **Doin Tech Limited** frontend assessment.
