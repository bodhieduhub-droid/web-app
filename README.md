# Bodhi Edu Hub / Reading Hub

Next.js + Supabase application for:

- public enquiries,
- monthly student account onboarding,
- manual UPI invoice verification,
- staff and super-admin operations,
- public notes and job postings,
- category-based exam alerts for subscribed students.

## Required Environment Variables

Existing Supabase variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

App/runtime variables:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=
```

Email via Resend HTTP API:

```bash
RESEND_API_KEY=
MAIL_FROM=
```

Cloudinary for payment screenshots and ID proof uploads:

```bash
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Main Routes

- `/` public Bodhi landing page
- `/register` public enquiry form
- `/login` shared login for students, staff, and super admin
- `/student` monthly student dashboard
- `/student/onboarding` first-login onboarding gate
- `/staff/*` operational staff dashboard
- `/super-admin/*` full admin dashboard

Compatibility redirects:

- `/reader` -> `/student`
- `/super-admin/readers` -> `/super-admin/students`
- `/super-admin/registrations` -> `/super-admin/enquiries`

## Billing Model

- Daily: `150`
- Weekly: `650`
- Monthly default: `1650`
- Registration fee: `400`
- Caution deposit: `300`
- Mid-month monthly admission uses `55/day` for remaining days
- Legacy monthly students are supported through per-student `monthly_fee`

## Notes

- Only monthly students receive accounts and dashboard access.
- Daily and weekly members remain operational records only.
- Payment flow is manual UPI only. Students upload proof, staff/admin verifies, and payment screenshots are deleted from Cloudinary after final review.
- Monthly reminders can be triggered by `GET /api/cron/billing` with `x-cron-secret` or `?secret=...`.
