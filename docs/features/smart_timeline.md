# Smart Timeline Feature

The IntelliWork Smart Timeline fundamentally reimagines how deeply tracked activity logs are displayed, shifting from a raw database-dump list into an intelligent, calendar-like grouping structure.

## Architectural Philosophy

By default, an OS-level tracking agent generates an immense amount of noise. Merely switching from a code editor to a browser and back generates 3 distinct records. If rendered literally, the UI becomes cluttered and unreadable. The Smart Timeline operates primarily on the React frontend to parse and merge these logs chronologically.

## Core Features

### 1. Sequential Application Compression (Accordion Grouping)

- The frontend parses the flat array of `ActivityLog` objects.
- If it detects consecutive activities belonging to the exact same `app_name`, it strips them from the top level and merges them into a `GroupedActivity` parent wrapper.
- The UI renders this parent block to display the cumulative time spent in that application burst. Clicking the parent toggles an accordion drop-down, revealing the hidden inner segments (the specific window titles or browser tabs accessed during that app burst).

### 2. Chronological Hour Blocking

- Once the list is grouped by application burst, it is then segmented by hour using the start time of the activity (e.g. `10:00 AM`).
- The UI injects localized Sticky Headers between these hourly segments. This allows users to scroll through their day as if reading a timeline schedule, visually segregating morning workflows from afternoon meetings.

### 3. Integrated Filtering

- A sleek top-bar UI provides primary control over the rendered output.
- **View Toggle:** Users can seamlessly toggle between "Grouped View" (the newly constructed intelligent grouping) or "Raw View" (a literal 1-to-1 log of every individual tracking ping, ideal for precise auditing).
- **Category Pills:** Multi-select pills let you instantly filter either View to only display blocks flagged under "Development," "Communication," or others.
