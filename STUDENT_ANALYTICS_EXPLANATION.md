# Student Analytics Explanation

This project now shows real student analytics on the student dashboard, not demo values.

## What powers it

- Backend service: `backend/src/services/studentAnalyticsService.js`
- Controller: `backend/src/controllers/analyticsController.js`
- Dashboard UI: `frontend/src/pages/StudentDashboard.jsx`

The dashboard reads live data from the database every time the page loads, so it changes automatically when new results are saved.

## Data sources

The student analytics are built from:

- `Enrollment` records for approved courses
- `Result` records for evaluated courses
- Each `Result` already stores:
  - `fuzzyScore`
  - `weightedAverage`
  - `riskScore`
  - `riskBand`
  - `cloAttainment`
  - `ploAttainment`

## Per-course analytics

For every enrolled course, the dashboard now shows:

- Fuzzy score
- Weighted average
- Risk score and risk band
- Average CLO attainment for that course
- Average PLO attainment for that course
- Weak CLOs and weak PLOs
- A short insight message explaining the weakness or strength

If a course has no result yet, it is shown as pending evaluation.

## Overall student analytics

The backend computes a student-level summary from all evaluated courses:

- Credits-weighted average fuzzy score
- Credits-weighted average risk score
- Overall CLO attainment average
- Overall PLO attainment average
- Completion rate
- Stability score based on how consistent the course fuzzy scores are

### Overall CLO and PLO weakness

The service aggregates CLO and PLO scores across all evaluated courses and counts:

- How many courses each CLO appears in
- How many of those courses are weak for that CLO
- The same for PLOs

That is why the analytics can say exactly which CLOs and PLOs are weak overall.

## Dynamic fuzzification and defuzzification

The overall OBE mastery score is not hardcoded.
It is calculated using fuzzy logic from these inputs:

- Performance score
- Overall CLO average
- Overall PLO average
- Stability score

The service:

1. Fuzzifies each input into low, medium, and high membership values.
2. Applies fuzzy rules.
3. Defuzzifies the activated rules into one crisp mastery score.

This means the final student mastery value is dynamic and changes when the course results change.

## What the dashboard shows

The student dashboard now includes:

- Summary cards for enrolled courses, completed courses, average fuzzy, mastery, and pending requests
- A chart for course fuzzy score vs OBE outcome score
- A risk distribution chart
- Separate CLO and PLO analytics charts
- Tables for weak CLOs and weak PLOs
- A course-wise OBE analysis table
- Recent alerts and course result history

## Why this is real analytics

The analytics are generated from the saved database records, not from fixed demo numbers.
When a faculty member enters or updates results, the student's:

- fuzzy score
- CLO attainment
- PLO attainment
- risk score
- weakness analysis

all update automatically on the next dashboard load.
