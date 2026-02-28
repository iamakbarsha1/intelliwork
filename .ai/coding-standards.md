# Coding Standards — IntelliWork

> Deterministic coding conventions for both Rust and TypeScript in this project. AI agents and human developers MUST follow these standards.

---

## General Rules

| Rule                | Value                                            |
| ------------------- | ------------------------------------------------ |
| Max function length | 40 lines (excluding comments and blank lines)    |
| Max file length     | 300 lines (split into modules if exceeding)      |
| Max line length     | 100 characters                                   |
| Indentation         | 4 spaces (Rust), 2 spaces (TypeScript/CSS)       |
| Trailing commas     | Always (both Rust and TypeScript)                |
| Semicolons          | Always (TypeScript)                              |
| String quotes       | Double quotes (TypeScript), double quotes (Rust) |

---

## Rust Standards

### Naming Conventions

| Item            | Convention                       | Example                 |
| --------------- | -------------------------------- | ----------------------- |
| Modules         | `snake_case`                     | `activity_tracker`      |
| Structs         | `PascalCase`                     | `ActivityLog`           |
| Enums           | `PascalCase`                     | `Category`              |
| Enum variants   | `PascalCase`                     | `Category::Development` |
| Functions       | `snake_case`                     | `get_foreground_app()`  |
| Constants       | `SCREAMING_SNAKE_CASE`           | `MAX_IDLE_THRESHOLD`    |
| Type parameters | Single uppercase letter          | `T`, `E`                |
| Traits          | `PascalCase` (adjective or noun) | `PlatformTracker`       |

### Error Handling

```rust
// ✅ CORRECT: Use Result with custom error types
pub fn get_activities(&self, date: &str) -> Result<Vec<ActivityLog>, StorageError> {
    // ...
}

// ✅ CORRECT: Use thiserror for error definitions
#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("Encryption error: {0}")]
    Encryption(String),
    #[error("Record not found: {0}")]
    NotFound(String),
}

// ❌ WRONG: Never use unwrap in production
let value = some_option.unwrap();

// ❌ WRONG: Never use expect in production
let value = some_result.expect("should work");

// ✅ CORRECT: Use ? operator or match
let value = some_result?;
let value = some_option.ok_or(StorageError::NotFound("key".into()))?;
```

### Module Organization

```rust
// File structure for each module:

// 1. Imports (grouped: std, external crates, internal modules)
use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::storage::Database;

// 2. Constants
const MAX_BATCH_SIZE: usize = 100;

// 3. Types / Structs / Enums
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityLog {
    // fields...
}

// 4. Trait implementations
impl ActivityLog {
    pub fn new(/* params */) -> Self {
        // ...
    }
}

// 5. Tests at bottom
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_example() {
        // ...
    }
}
```

### Documentation

````rust
/// Classifies a work activity into a category based on app name and window title.
///
/// Uses rule-based matching first, falling back to "Uncategorized" if no rules match.
///
/// # Arguments
///
/// * `app_name` - The name of the foreground application
/// * `window_title` - The window title of the active window
///
/// # Returns
///
/// A `ClassificationResult` containing the category and confidence score.
///
/// # Examples
///
/// ```
/// let classifier = RuleBasedClassifier::new();
/// let result = classifier.classify("VS Code", "index.ts");
/// assert_eq!(result.category, Category::Development);
/// ```
pub fn classify(&self, app_name: &str, window_title: &str) -> ClassificationResult {
    // ...
}
````

---

## TypeScript Standards

### Naming Conventions

| Item         | Convention                    | Example                 |
| ------------ | ----------------------------- | ----------------------- |
| Components   | `PascalCase`                  | `DailySummary.tsx`      |
| Hooks        | `camelCase` with `use` prefix | `useTracking.ts`        |
| Utilities    | `camelCase`                   | `formatDuration.ts`     |
| Constants    | `SCREAMING_SNAKE_CASE`        | `MAX_RETRY_COUNT`       |
| Interfaces   | `PascalCase`                  | `ActivityLog`           |
| Type aliases | `PascalCase`                  | `Category`              |
| CSS files    | `kebab-case`                  | `daily-summary.css`     |
| Test files   | Same as source + `.test`      | `DailySummary.test.tsx` |

### Type Safety

```typescript
// ✅ CORRECT: Explicit types for all exports
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// ✅ CORRECT: Use interfaces for data shapes
export interface ActivityLog {
  id: string;
  app_name: string;
  window_title: string | null;
  duration_seconds: number;
  category: Category;
}

// ❌ WRONG: Never use `any`
function processData(data: any) {}

// ✅ CORRECT: Use `unknown` with type guards
function processData(data: unknown): ActivityLog {
  if (!isActivityLog(data)) {
    throw new Error("Invalid activity log data");
  }
  return data;
}
```

### React Component Pattern

```typescript
// ✅ CORRECT pattern for React components

import { useState, useCallback, memo } from 'react';
import type { ActivityLog } from '../lib/types';
import './activity-card.css';

interface ActivityCardProps {
  /** The activity to display */
  activity: ActivityLog;
  /** Callback when the delete button is clicked */
  onDelete: (id: string) => void;
}

/**
 * Displays a single activity log entry with category badge and duration.
 */
export const ActivityCard = memo(function ActivityCard({
  activity,
  onDelete,
}: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = useCallback(() => {
    onDelete(activity.id);
  }, [activity.id, onDelete]);

  return (
    <div className="activity-card" data-testid={`activity-${activity.id}`}>
      {/* component content */}
    </div>
  );
});
```

### Hook Pattern

```typescript
// ✅ CORRECT pattern for custom hooks

import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { TrackingStatus } from "../lib/types";

interface UseTrackingReturn {
  isTracking: boolean;
  status: TrackingStatus | null;
  toggleTracking: () => Promise<void>;
  error: string | null;
}

/**
 * Hook for managing tracking state via Tauri IPC.
 */
export function useTracking(): UseTrackingReturn {
  const [status, setStatus] = useState<TrackingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const result = await invoke<TrackingStatus>("get_tracking_status");
      setStatus(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const toggleTracking = useCallback(async () => {
    try {
      const result = await invoke<TrackingStatus>("toggle_tracking");
      setStatus(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  return {
    isTracking: status?.is_tracking ?? false,
    status,
    toggleTracking,
    error,
  };
}
```

### Import Order

```typescript
// 1. React / framework imports
import { useState, useEffect } from "react";

// 2. Third-party imports
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

// 3. Internal components
import { ActivityCard } from "../components/ActivityCard";

// 4. Internal utilities
import { formatDuration } from "../lib/utils";

// 5. Types (use `import type` when possible)
import type { ActivityLog, Category } from "../lib/types";

// 6. Styles
import "./dashboard.css";
```

---

## CSS Standards

```css
/* ✅ CORRECT: Use CSS custom properties for theming */
:root {
  --color-primary: hsl(220, 90%, 56%);
  --color-surface: hsl(0, 0%, 100%);
  --color-text: hsl(0, 0%, 13%);
  --radius-md: 8px;
  --shadow-sm: 0 1px 2px hsl(0, 0%, 0%, 0.05);
  --transition-fast: 150ms ease;
}

/* ✅ CORRECT: Use BEM-like naming */
.activity-card {
}
.activity-card__header {
}
.activity-card__title {
}
.activity-card--expanded {
}

/* ❌ WRONG: No inline styles, no !important */
```

---

## Git Commit Standards

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(tracker): add idle detection for macOS
fix(ai): handle empty activity list in summarizer
docs(readme): update installation instructions
test(storage): add encryption round-trip tests
refactor(platform): extract common window detection logic
perf(tracker): reduce polling CPU usage by 40%
chore(deps): update tauri to v2.1.0
```
