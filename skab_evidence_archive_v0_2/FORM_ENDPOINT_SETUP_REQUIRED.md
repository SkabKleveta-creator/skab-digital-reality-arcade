# FORM ENDPOINT SETUP — REQUIRED BEFORE LIVE FEEDBACK

The evidence pages include a feedback form placeholder:

`https://formspree.io/f/YOUR_FORM_ID_HERE`

Before live use, create a static-site form endpoint with the chosen form provider and route submissions to:

`kenneth.kleveta@gmail.com`

Then replace every `YOUR_FORM_ID_HERE` occurrence in:

`/evidence/*/index.html`

Do not route Evidence Archive review feedback to:
- developer email
- arcade support email
- GitHub Issues
- public mailto links

## Recommended form fields

Each page already sends:
- project_title
- project_slug
- review_context
- evidence_page_url
- client_submission_date
- reviewer_name optional
- reviewer_email optional
- overall_grade optional
- permission_to_quote
- feedback required

## Anonymous wording

The pages intentionally say:
“Name and email are optional. Anonymous feedback is welcome. ‘Anonymous’ means you are not required to identify yourself; technical metadata may still be processed by the form service.”
