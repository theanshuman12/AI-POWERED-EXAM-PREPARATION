# AI Power Exam Preparation Platform

An intelligent, web-based smart exam preparation platform developed to assist students in preparing for competitive and university examinations through adaptive quizzes, real-time analytics, explainable weak-topic identification, and personalized recommendation workflows.

---

## 1. System Architecture

- **Frontend**: Modern React with TypeScript, Tailwind CSS, Lucide icons, Recharts data visualization, and Outfit / Plus Jakarta Sans display typography.
- **Backend API**: Node.js & Express RESTful API with JSON Web Token (JWT) authentication, role-based access control (Student vs. Administrator), and automated assessment evaluation.
- **AI Recommendation Engine**: Performance-based heuristic mathematical model analyzing cumulative accuracy, recent attempt momentum, and question response time.
- **AI Study Assistant**: Generative AI concept explainer, exam hints, and 1-minute revision summaries powered by `@google/genai` (with zero-failure textbook fallback).
- **Database & Storage**: Seeded relational structure with comprehensive computer science curriculum (DBMS, DSA, Operating Systems, Computer Networks, Software Engineering).

---

## 2. Explainable Recommendation Model (Viva & Evaluation Ready)

To ensure full transparency and compliance with academic evaluation standards, the platform strictly avoids unexplainable black-box neural networks. Instead, it utilizes an explainable multi-factor formula:

$$\text{Performance Score} = 0.50 \cdot \text{Overall Accuracy} + 0.30 \cdot \text{Recent Accuracy} + 0.20 \cdot \text{Time Performance}$$

### Thresholds:
* **Score < 0.40**: **Weak Topic** $\rightarrow$ Recommends **Easy** difficulty and fundamental axiomatic concept revision.
* **0.40 $\le$ Score $\le$ 0.70**: **Moderate Topic** $\rightarrow$ Recommends **Medium** difficulty and scenario-based questions.
* **Score > 0.70**: **Strong Topic** $\rightarrow$ Recommends **Hard** difficulty and advanced timed challenges.

---

## 3. Demo Credentials

The platform provides one-click demo access directly from the top navigation bar and authentication screen:

* **Demo Student**: `student@example.com` / `student123`
* **Demo Admin**: `admin@example.com` / `admin123`

---

## 4. Production Deployment

Build and start the combined Express/Vite application with:

```bash
npm install
npm run build
npm start
```

Configure `JWT_SECRET`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, and `APP_URL` in the hosting environment. `SUPER_ADMIN_EMAIL` identifies the single protected owner account server-side, and `SUPER_ADMIN_PASSWORD` is used only when the embedded storage is initialized without an owner account. In production the server refuses to initialize without the required owner settings. `PORT` is supplied by the hosting platform and defaults to `3000` for local development. `GEMINI_API_KEY` is optional; without it, the built-in curriculum fallback provides explanations and hints. `MONGO_URI` is optional and the current application continues to use its embedded JSON storage when it is unset. The FastAPI service under `ai-service/` is optional because the Node backend falls back to its native recommendation calculation when the Python analyzer is unavailable. The browser uses same-origin `/api` requests, so no frontend API URL is required.

### Authentication and Admin Authorization

Users are always registered with the `USER` role. Admin access is requested through `POST /api/admin-requests` and remains pending until the one `SUPER_ADMIN` account approves it. The request owner can check `GET /api/admin-requests/me`; only `SUPER_ADMIN` can call `GET /api/admin-requests` or `PUT /api/admin-requests/:id/approve` and `/reject`. Existing `ADMIN` accounts retain academic administration features but cannot approve requests or change roles. Request reviews and role changes are stored in the embedded JSON `auditLogs` collection.

### Admin Access System

- Normal users register as `USER`.
- Users can request Admin access.
- Requests remain `PENDING` until approved.
- Only `SUPER_ADMIN` can approve or reject requests.
- Existing `ADMIN` users cannot approve other Admins.

---

## 5. Key Functional Capabilities

1. **Smart Dashboard**: Real-time preparation progress, average score, overall accuracy, recent tests, and priority adaptive recommendations.
2. **Curriculum Syllabi**: Comprehensive subject and topic directory with difficulty filters and one-click practice launchers.
3. **Timed Mock Test & Practice Engine**: Question palette with status flags (Answered, Unattempted, Marked for Review), countdown timer, response-time tracker, and instant AI hints.
4. **Assessment Evaluation**: Automatic scoring, time analysis, topic accuracy breakdowns, and detailed step-by-step solutions with explanations.
5. **AI Recommendation Hub**: Deep topic classification cards displaying performance score, rationale, recommended difficulty, revision checklists, and instant practice links. Includes a **"Demonstrate Viva Benchmark Data"** button that injects the sample evaluation dataset (SQL JOIN 88%, Normalization 42%, Transactions 55%).
6. **Analytics Suite**: Interactive Recharts graphs showing topic accuracy bars, score trajectory lines over time, and correct-to-incorrect ratios.
7. **AI Concept Study Assistant**: Markdown-formatted concept primers, axioms to remember, common exam traps, and high-yield notes.
8. **Admin Control Console**: Question bank manager (create, filter, and delete questions with 4 options, difficulty, and rationale), subject syllabus oversight, and student progress monitoring.
