# Frontend Dashboard — IntelliWork

> React dashboard with real-time activity tracking, category visualization, and settings.

## Architecture

```
src/
├── App.tsx                    # Root: layout, routing, dark mode
├── hooks/
│   └── useTauri.ts            # useTracking, useActivities, useConfig
├── components/
│   ├── TrackingToggle.tsx      # Start/Stop + live status indicator
│   ├── ActivityTimeline.tsx    # Scrollable activity list + cards
│   ├── CategoryChart.tsx      # Horizontal stacked bar + legend
│   ├── DailySummary.tsx       # 4-stat overview + productivity bar
│   └── SettingsPanel.tsx      # Config toggles, selects, inputs
├── lib/
│   ├── types.ts               # TypeScript types (mirror Rust)
│   ├── utils.ts               # formatDuration, formatTime, getCategoryColor
│   └── constants.ts           # APP_NAME, version
├── styles/
│   ├── globals.css            # Design tokens, dark mode, base styles
│   └── dashboard.css          # Dashboard layout, components
└── test/
    ├── utils.test.ts          # 17 utility tests
    └── category-colors.test.ts # 9 color utility tests
```

## Views

| View      | Components                                                    | Description                                   |
| --------- | ------------------------------------------------------------- | --------------------------------------------- |
| Dashboard | TrackingToggle, DailySummary, CategoryChart, ActivityTimeline | Main view with live tracking                  |
| Settings  | SettingsPanel                                                 | Configure tracking, office hours, AI provider |

## Hooks (useTauri.ts)

| Hook                  | IPC Commands                                                            | Polling                   |
| --------------------- | ----------------------------------------------------------------------- | ------------------------- |
| `useTracking()`       | `start_tracking`, `stop_tracking`, `poll_tracker`, `get_tracking_state` | 5s when active            |
| `useActivities(date)` | `get_activities`                                                        | Manual + 30s auto-refresh |
| `useConfig()`         | `get_all_config`, `set_config`                                          | On mount                  |

## Category Colors

| Category      | Color         |
| ------------- | ------------- |
| Development   | Blue (220°)   |
| Research      | Purple (260°) |
| Communication | Orange (35°)  |
| Meetings      | Green (150°)  |
| Design        | Pink (320°)   |
| Productivity  | Cyan (200°)   |
| Entertainment | Red (0°)      |

## Dark Mode

Toggle via nav button. Uses `[data-theme="dark"]` CSS attribute selector. Auto-detects system preference on first load.

## Testing

```bash
pnpm test          # Run all frontend tests
npx tsc --noEmit   # Type-check without build
```
