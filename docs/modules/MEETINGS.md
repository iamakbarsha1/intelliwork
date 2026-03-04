# Meeting Detection — IntelliWork

> Automatic meeting detection using app name patterns and window title keywords.

## How It Works

1. **App Detection**: When a meeting app is in the foreground (Zoom, Teams, etc.), mark as meeting
2. **Title Analysis**: Scan window title for keyword matches to classify meeting type
3. **Classification**: `scheduled` (keyword found) or `ad_hoc` (meeting app without keyword)

## Supported Meeting Apps

| App             | Name Pattern  | Bundle ID                                     |
| --------------- | ------------- | --------------------------------------------- |
| Zoom            | `zoom`        | `us.zoom.xos`                                 |
| Microsoft Teams | `teams`       | `com.microsoft.teams`, `com.microsoft.teams2` |
| Google Meet     | `meet`        | (runs in Chrome)                              |
| Webex           | `webex`       | `com.cisco.webexmeetingsapp`                  |
| Slack           | `slack`       | `com.tinyspeck.slackmacgap`                   |
| Discord         | `discord`     | `com.hnc.Discord`                             |
| Skype           | `skype`       | `com.skype.skype`                             |
| FaceTime        | `facetime`    | `com.apple.FaceTime`                          |
| GoToMeeting     | `gotomeeting` | —                                             |
| BlueJeans       | `bluejeans`   | —                                             |
| RingCentral     | `ringcentral` | —                                             |
| Amazon Chime    | `chime`       | —                                             |

## Window Title Keywords

Keywords (case-insensitive) that upgrade detection from `ad_hoc` to `scheduled`:

```
meeting, call, conference, huddle, standup, stand-up, sync,
1:1, one-on-one, retrospective, retro, sprint, planning,
demo, review, interview, webinar, presentation,
screen share, screen sharing
```

## MeetingInfo Output

| Field           | Type             | Description                       |
| --------------- | ---------------- | --------------------------------- |
| `is_in_meeting` | `bool`           | Whether a meeting is detected     |
| `meeting_title` | `Option<String>` | Window title or "{App} call"      |
| `meeting_type`  | `String`         | `scheduled` or `ad_hoc`           |
| `source_app`    | `String`         | App name that triggered detection |
