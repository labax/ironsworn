# OB-11 onboarding responsive and accessibility checks

Date: 2026-07-14

Scope: welcome, character handoff, first-vow, linked progress-track review, final review/completion, skip, exit confirmation, validation, loading/saving, and success states.

## Viewport and zoom checklist

Use the same onboarding state machine and routes at each size; do not switch to a separate mobile flow.

- Desktop: 1280 px wide at 100% and 200% browser zoom.
- Tablet: 768 px wide at 100% and 150% browser zoom.
- Mobile: 390 px and 320 px wide at 100% and increased text size.

Expected result at each size:

- The page has no ordinary horizontal scrolling.
- Long character names, vow titles, helper text, errors, and review summaries wrap inside their cards.
- On narrow screens, content remains a single-column progression.
- Back, Exit setup, and the primary action remain visible, readable, and consistently ordered.
- Touch targets for onboarding buttons remain at least practical mobile size.

## Keyboard and focus checklist

- Tab to Start setup and Skip for now from the welcome page.
- Continue to character creation, enter a name and supported values, save, then continue to first vow.
- Tab through Vow title, Rank, Description, Notes, Back, Exit setup, and Review setup.
- Submit an empty vow title and confirm focus moves to the invalid field with an announced error.
- Submit a valid vow and confirm focus moves to the generated vow/progress-track review panel.
- Open Exit setup with dirty first-vow content, confirm focus enters the alert dialog, Escape/cancel returns focus to Exit setup, and confirming exits.
- From final review, tab to edit links, Back, Exit setup, and Complete setup.
- Trigger final review validation and confirm focus moves to the error summary.
- Complete setup and confirm the route moves to the play workspace.

## Screen-reader sanity checklist

- Each step exposes a logical heading and a step label such as “Step 1 of 4”.
- Form fields keep persistent labels and helper/error descriptions.
- Step changes and generated review/validation summaries use focus movement plus live status or alert text.
- Current progress, errors, saving, disabled, and success states are communicated with text, not color alone.
