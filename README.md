# Wonderabouts with Anoop

Stories, activities and everyday discoveries with Wobble, during intentional family sessions.

Website: https://anooptejt.github.io/wonderabouts/

## Publishing

GitHub Pages serves the `docs` folder from `main`. No build or package installation is needed. This repository is public: only approved publication-ready content belongs here. Keep personal drafts, private family writing, credentials and unpublished media outside this repository.

For each new story, create a descriptive folder under `docs/stories`, add its activity under `docs/activities` if appropriate, and link both from the homepage. Include a unique title, description, canonical URL, descriptive image alternative text and the new page URL in `docs/sitemap.xml`. Check every link and the mobile layout before publishing. Dates must reflect actual publication or meaningful revision.

Google Search Console should use the URL-prefix property `https://anooptejt.github.io/wonderabouts/` and sitemap `https://anooptejt.github.io/wonderabouts/sitemap.xml`. Submission does not guarantee indexing or ranking. This project does not modify the professional website or its root robots.txt.

## Contents

- Home: `docs/index.html`
- First story: `docs/stories/wobble-finds-another-way/index.html`
- Printable activity: `docs/activities/find-another-route/index.html`
- Author and editorial approach: `docs/about/index.html`
- Privacy: `docs/privacy/index.html`
- Shared styling: `docs/styles.css`

## Illustrations

Illustrations are AI-generated and depict fictional characters, not photographs of real children. `family-activity.jpg` comes from the author's supplied story artwork. `wobble-and-friends.jpg` was generated for this site with the built-in image generator and optimized as JPEG.

Art direction: an orange, rubber-tracked robot named Wobble with two blue sensor eyes and a small antenna, collaborating with three fictional children of different ages on a paper map and cardboard delivery route in a sunny imaginative garden. Playful storybook-style 3D illustration, cobalt blue, orange and yellow accents, no text, logos or recognizable franchise characters.

The activity's written safety instructions take precedence over decorative illustration details. Stories are fiction; engineering connections are analogies, not developmental or medical claims. There are no accounts, comments, analytics scripts, advertising pixels, or server-submitted forms. The family check-in uses browser-only controls.

Copyright 2026 Anoop Tej Thotapalli. No open-source license is granted by this repository.

## Family sessions (September 2026)

The static site now includes `docs/start/index.html`, `session.js`, `session-core.js`,
and `session.css`. No backend, account, API, or production build dependency is needed.

- Five picture questions; answers stay in page memory and are discarded on navigation,
  refresh, restart, or beginning a session. Nothing is transmitted.
- A grown-up confirms each unfinished / not-applicable / help response, and the final
  duration (1–120 minutes). A school-day response is reflection, not assessment.
- Local storage key `wonderabouts.session.v1` holds one shared browser session,
  chosen duration, local calendar day, wall-clock deadline, and allowlisted section IDs.
  The browser clock is trusted. This is family guidance, **not authentication or a
  parental-control security boundary**. Source HTML is public. Browser data can be edited.
- Refresh and navigation retain the deadline. Leaving or closing a tab does not pause.
  Explicit pause freezes remaining time; resume / extension needs grown-up confirmation.
  Expiry displays a modal stopping screen. The next local calendar day needs a new check-in.
- Storage events synchronize pause, resume, stop, and clearing across tabs. Bookmarks
  merge into the latest state. One browser is one family session; there are no child profiles.
- If local storage is blocked, session storage is used with a visible tab-only warning.
  If both are blocked, starting is refused with an explanation rather than promising saving.
- Privacy includes a two-step clear-data control. No analytics, advertising, microphones,
  camera use, uploads, or external fonts were added.
- Wobble’s 72-second child-voice welcome replaces the GIF on the home and start pages.

### Speaking introduction

The user authorized publishing the latest happy child-voice video in place of the GIF.
The home and start pages serve the same native MP4 player, accurate WebVTT captions,
static poster and complete written transcript. Playback is optional, has no autoplay
or loop, and does not download video until requested (`preload="none"`). The character
uses a synthetic child voice and audio-aligned digital mouth. The current video uses
the garden scene throughout; separate illustrated question cues remain future visual work.

Starting a check-in, opening the transcript, hiding the tab, or pausing/ending an active
family session pauses the welcome. Playback during a paused session requires the existing
grown-up resume flow. A welcome watched before check-in is outside the session timer;
watching it during an active session uses that session's remaining time. A media-load
failure leaves the transcript and check-in available. No third-party video embed is used.

### Validation and local preview

Run `npm test` for session-domain tests and `npm run check` for JavaScript syntax,
local links / fragments, image alt text, unique IDs and basic metadata. No npm install
is required. Serve the `docs` directory mounted at `/wonderabouts/` (the deployed
GitHub Pages prefix), then exercise the family flow in a real browser.

Manual coverage should include: answer correction, exception refusal, adult approval,
custom time validation, actual warning and expiry, pause/resume, refresh, activity-step
saving, cross-tab stop, direct-link gating, privacy clearing, keyboard navigation, mobile
layout, and print preview. Storage-denial and calendar-rollover branches also have
unit coverage; these should receive real-device testing before claiming broad compatibility.
