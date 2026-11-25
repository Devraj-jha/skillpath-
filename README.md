# SkillPath — SIH26134

**Skill Development and Industry Requirements Alignment**  
A no-framework career exploration and skill-gap assessment platform for B.Tech CSE students.

SkillPath is intentionally built with **HTML5, CSS3, vanilla JavaScript and Node.js built-in modules**. There is no React, Express, frontend framework, CSS framework or runtime dependency installation.

## 1. Run locally

Requirements: Node.js 20 or newer.

```bash
cd skillpath
node server.js
```

Open [http://localhost:3000](http://localhost:3000).

The application also supports:

```bash
npm start
npm run dev
npm run check
```

`npm install` is not required — the project has no third-party Node dependencies.

## 2. Start with the public demo

Open **Demo lab** from the navigation or go directly to:

`http://localhost:3000/#/demo`

The demo does not require an account. It includes:

- Four role benchmarks: Software Developer, Web Developer, Data Analyst and Cybersecurity Associate.
- Three example student profiles: Starting out, Balanced builder and Strong generalist.
- Editable proficiency levels for each competency.
- Custom skill requirements with configurable required level and importance weight.
- Live weighted skill-match recalculation.
- Possessed / Improve / Missing status classification.
- Role-specific resources and a staged learning roadmap.
- Local demo progress, JSON scenario export and printable report.
- Dark/light mode, four accent palettes and five background textures.

Demo profile changes and appearance preferences use `localStorage` in the current browser. They do not create an account or write to the server.

## 3. Demonstration accounts

The local server seeds these fictional evaluation accounts on first start:

| Role | Email | Password |
|---|---|---|
| Student | `student@skillpath.demo` | `SkillpathDemo26!` |
| Administrator | `admin@skillpath.demo` | `AdminDemo26!` |

The seeded student has a sample profile with a mixture of strong and developing skills. The administrator can inspect registered student records, manage career role requirements and add learning resources.

Change these passwords or remove the demonstration accounts before exposing a non-demo deployment to real users.

## 4. Deploy to Vercel

The repository includes `api/[...route].js` as a Vercel Node.js Function adapter. The same API handler is used by the local Node HTTP server and by the Vercel function. The static frontend is served from `public/`.

1. Push the project folder to a Git repository.
2. Import the repository into Vercel.
3. Keep the project root as the repository root. No build command is needed; the frontend is static and the API function is under `api/`.
4. Add the environment variables below in Vercel Project Settings → Environment Variables.
5. Redeploy after adding environment variables.

### Required in Vercel

Set a long, random session signing secret:

```text
SESSION_SECRET=<long-random-secret>
```

You can generate one locally with:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

### Recommended for durable hosted data

The local academic build stores JSON files in `data/`. Vercel Functions have a read-only deployed filesystem, with `/tmp` available only as temporary scratch space. That means JSON writes inside a Vercel function are not durable and must not be treated as a production database.

For persistent accounts, profiles, assessments and roadmap data on Vercel, connect an Upstash Redis database and add its REST credentials:

```text
KV_REST_API_URL=https://<your-upstash-database>.upstash.io
KV_REST_API_TOKEN=<your-upstash-rest-token>
```

The included `lib/database.js` detects these variables and stores each JSON collection as a Redis key through the Upstash REST API. No Redis client package is required. If the variables are not configured, the Vercel function can use temporary `/tmp` data for a limited evaluation, but writes may disappear between instances or cold starts.

**Do not use the unconfigured temporary Vercel storage mode for real student records.** The public demo remains usable without a database because its interactive scenario is kept in the visitor's browser.

## 5. Project structure

```text
skillpath/
├── api/
│   └── [...route].js          # Vercel Node.js Function adapter
├── data/
│   ├── users.json
│   ├── student-profiles.json
│   ├── skills.json
│   ├── job-roles.json
│   ├── resources.json
│   ├── assessments.json
│   └── learning-progress.json
├── lib/
│   ├── auth.js                # Signed HTTP-only cookie sessions
│   ├── database.js            # Atomic local JSON + optional Upstash REST
│   ├── handler.js             # Shared REST API route handler
│   ├── matching.js            # Weighted skill alignment formula
│   ├── recommendations.js     # Gap-to-resource recommendation logic
│   └── validation.js          # Server-side input validation
├── public/
│   ├── assets/
│   │   ├── brand-mark.svg
│   │   └── hero-lab.svg
│   ├── css/main.css
│   ├── js/
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── core.js
│   │   └── demo.js
│   └── index.html
├── scripts/check.js
├── .env.example
├── package.json
├── server.js
└── vercel.json
```

## 6. API overview

### Public

- `GET /api/health`
- `GET /api/roles`
- `GET /api/roles/:id`
- `GET /api/resources-public`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Student (signed-in)

- `GET /api/dashboard`
- `GET /api/profile`
- `PUT /api/profile`
- `POST /api/assessment`
- `GET /api/assessment/history`
- `GET /api/assessment/:id`
- `GET /api/recommendations`
- `GET /api/progress`
- `POST /api/progress`
- `PATCH /api/progress/:id`

### Administrator (server-authorized)

- `GET /api/admin/students`
- `POST /api/admin/roles`
- `PUT /api/admin/roles/:id`
- `POST /api/admin/resources`
- `PUT /api/admin/resources/:id`

## 7. Skill-match calculation

For every required skill:

```text
contribution = min(student_level / required_level, 1)
weighted_points = contribution × skill_weight

match_percentage =
  (sum(weighted_points) / sum(skill_weights)) × 100
```

- **Possessed:** the student's level meets or exceeds the role requirement.
- **Needs Improvement:** the student has some exposure but is below the role requirement.
- **Missing:** the student has no recorded exposure.

Levels range from 0 to 3. The algorithm caps contribution at 100% for an individual skill, so proficiency above the requirement does not cause the overall score to exceed 100%. The score is an educational alignment estimate, not a job-readiness or employment guarantee.

## 8. Security and storage notes

- Passwords are hashed with Node.js `crypto.scrypt`; plaintext passwords are never persisted.
- Session tokens are HMAC-signed and sent in HTTP-only, same-site cookies.
- Student and administrator routes perform server-side role checks. Hiding an admin link in the frontend is not the authorization mechanism.
- The local JSON adapter writes through a temporary file followed by an atomic rename and serializes writes within the current Node process.
- JSON file storage is suitable for a small academic demonstration, not concurrent production workloads or a multi-instance deployment.
- Upstash REST is optional and only used when both `KV_REST_API_URL` and `KV_REST_API_TOKEN` are configured.
- For a production launch, replace demo credentials, use a managed database, review privacy requirements, add rate limiting and CSRF controls appropriate to your hosting setup, and have the application security-reviewed.

## 9. Manual evaluation flow

1. Open the landing page and demonstrate the visual appearance controls.
2. Open **Demo lab** without signing in.
3. Switch role and student persona.
4. Edit skill levels and add a custom skill.
5. Open **Skill matrix** and **Learning pathway** tabs.
6. Export the JSON scenario or print the report.
7. Sign in as the demo student.
8. Edit the profile, save skills and select a target career.
9. Run an assessment and inspect the skill gap report.
10. Open recommendations, update roadmap statuses and verify they persist after refresh.
11. Sign out and sign in with the administrator demonstration account.
12. Inspect registered students, edit a role benchmark and add a learning resource.

## 10. Known academic-demo boundaries

- The demo page is deliberately browser-local and does not submit visitor skill ratings to the backend.
- The forgot-password screen is not an email-reset flow; password reset delivery requires an email provider and account recovery design.
- Local JSON writes are protected against overlapping writes in a single Node process, but JSON files are not a substitute for a transactional database.
- Vercel durable storage requires the optional Upstash variables described above.
- External learning links are references to documentation, practice platforms or provider learning pages; SkillPath does not claim that they are accredited certifications.
