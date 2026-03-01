# Classification Rules — IntelliWork

> Mapping applications and window titles to activity categories.

## Rule Structure

```rust
ClassificationRule {
    pattern: String,       // Case-insensitive substring
    match_target: MatchTarget, // AppName | WindowTitle | BundleId | Either
    category: String,      // Target category
    confidence: f64,       // 0.0 – 1.0
}
```

## Rules by Category

### Development (25 rules)

VS Code, IntelliJ, WebStorm, PyCharm, Android Studio, Xcode, Sublime Text, Atom, Vim, Neovim, Terminal, iTerm, Warp, Alacritty, Docker, Postman, Insomnia, GitHub Desktop, Tower, SourceTree, DBeaver, TablePlus, pgAdmin

### Research (13 rules)

Stack Overflow, docs.rs, MDN Web Docs, GitHub, GitLab, Bitbucket, npm, crates.io, medium.com, dev.to, Wikipedia

### Communication (10 rules)

Slack, Discord, Teams, Telegram, WhatsApp, Messages, Mail, Outlook, Gmail, Thunderbird

### Meetings (5 rules)

Zoom, FaceTime, Webex, GoToMeeting, BlueJeans

### Design (6 rules)

Figma, Sketch, Adobe XD, Photoshop, Illustrator, Canva

### Productivity (16 rules)

Notion, Obsidian, Jira, Confluence, Trello, Linear, Asana, Google Docs, Google Sheets, Word, Excel, PowerPoint, Numbers, Pages, Keynote, Preview

### Entertainment (9 rules)

YouTube, Netflix, Spotify, Apple Music, Twitter, Reddit, Instagram, Facebook, TikTok

## Matching Logic

1. All patterns are **case-insensitive**
2. Match against `AppName`, `WindowTitle`, `BundleId`, or `Either`
3. When multiple rules match, **highest confidence** wins
4. No match → `Uncategorized` with confidence `0.0`
