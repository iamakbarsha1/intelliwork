## Description

This PR implements **Phase 8: Export & Polish**, fulfilling the remaining core product features before finalizing testing and CI/CD.

### Features Included

- **CSV Export:** Integrated Tauri dialog with the `csv` crate for robust native timesheet exports.
- **PDF Export:** Configured frontend printing functionality to natively prompt OS-level PDF saving of daily reports.
- **Summary Editing flow:** Added an inline React Markdown editor to the `DailySummary` card that hooks into a new backend `upsert_summary` Tauri Command, allowing for human-in-the-loop oversight.
- **Data Deletion Flow:** Provided specific single and bulk deletion routes in the `ActivityTimeline` UI, powered by a new `deleteActivities` frontend hook and `window.confirm` dialogues.
- **Polish / Theming:** Verified existing implementation of Dark theme tokens & CSS-based micro animations.
- **Documentation:** Authored `EXPORT.md` outlining the architecture for export and polish features.

### Testing Performed

- `cargo check` & `cargo build` complete without errors.
- UI validated natively in development server simulation.

### Next Steps

- **Phase 9: Testing & Production** (CI/CD GitHub Actions, unit/E2E test suite finalization, production code signing).
