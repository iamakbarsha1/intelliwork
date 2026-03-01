# AI Engine — IntelliWork

> Hybrid activity classification (rules + LLM) and daily summary generation.

## Architecture

```
src-tauri/src/ai/
├── mod.rs           # Module exports
├── errors.rs        # AiError enum
├── rules.rs         # 85+ classification rules (7 categories)
├── classifier.rs    # RuleBasedClassifier + HybridClassifier
├── anonymizer.rs    # DataAnonymizer (email/URL/path redaction)
├── llm.rs           # LLM client (OpenAI, Gemini, Ollama)
└── summarizer.rs    # DailySummary generator
```

## Classification Pipeline

```
Activity → RuleBasedClassifier (pattern match)
             ↓ confidence ≥ threshold → return result
             ↓ confidence < threshold → HybridClassifier
                                          ↓
                                    LLM fallback (anonymized data)
                                          ↓
                                    ClassificationResult
```

## Categories

| Category      | Example Apps                         | Confidence |
| ------------- | ------------------------------------ | ---------- |
| Development   | VS Code, IntelliJ, Terminal, Docker  | 0.80–0.95  |
| Research      | Stack Overflow, GitHub, MDN, docs.rs | 0.70–0.85  |
| Communication | Slack, Discord, Mail, WhatsApp       | 0.80–0.90  |
| Meetings      | Zoom, FaceTime, Webex, GoToMeeting   | 0.90–0.95  |
| Design        | Figma, Sketch, Photoshop, Canva      | 0.80–0.95  |
| Productivity  | Notion, Jira, Google Docs, Excel     | 0.70–0.85  |
| Entertainment | YouTube, Netflix, Spotify, Reddit    | 0.70–0.90  |

## LLM Providers

| Provider   | Local | API Key | Model            |
| ---------- | ----- | ------- | ---------------- |
| Rule-Based | ✅    | No      | —                |
| Ollama     | ✅    | No      | Any local model  |
| OpenAI     | ❌    | Yes     | gpt-4o-mini      |
| Gemini     | ❌    | Yes     | gemini-2.0-flash |

## Anonymization

Before cloud AI: emails → `[EMAIL]`, URLs → `[URL]`, paths → `[PATH]`

## Testing

```bash
cargo test -p intelliwork -- ai
```

**33 AI tests**: 3 rules, 11 classifier, 6 anonymizer, 7 LLM, 6 summarizer.
