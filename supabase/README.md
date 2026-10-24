# Student Portal setup (Supabase)

This repository is hosted as a static GitHub Pages site. The SQL schema is only the database foundation; it does not by itself enable registration, login, exam grading, admin access, or certificate issuance.

## 1. Create the Supabase project
1. Open https://supabase.com/ and create a project.
2. In Project Settings → API, copy the Project URL and the publishable/anon key.
3. Never put the service-role key in HTML or JavaScript and never send it to students.

## 2. Create the tables
1. Open the Supabase project's SQL Editor.
2. Open `supabase/schema.sql` from this repository.
3. Paste the SQL into the SQL Editor and run it.
4. Verify the tables under Table Editor: profiles, courses, questions, question_answer_keys, exam_attempts, certificates.

## 3. Before turning on real student exams
The current website is static GitHub Pages. Secure exam grading and certificate generation must run in a trusted server-side environment (for example Supabase Edge Functions). Do not grade exams or issue certificate numbers solely in browser JavaScript. Do not add any service-role key to the public repository.

Required next backend work:
- Sign-up/sign-in/sign-out with Supabase Auth and email verification/password reset.
- A safe public question endpoint that returns question text/options but never answer keys.
- A server-side submit-exam function that validates 50/100 questions, grades answers, enforces the 60% pass mark, and saves the attempt.
- Server-side certificate issuance only for passed attempts, with a random/unique certificate number.
- A public verification page that shows only limited certificate validity details.
- Admin role provisioning and server-side authorization for question/student/result management.
- Rate limiting and testing of RLS policies before public launch.

## 4. Admin safety
The schema defaults every new user to the student role. Do not allow public sign-up to choose their own role. The first admin must be provisioned securely by the project owner; add admin policies/functions only after that step.

## 5. Current status
Database schema foundation committed. Supabase project credentials have not been connected to the website, and no live student login or production exam flow should be advertised until the remaining steps are implemented and tested.
