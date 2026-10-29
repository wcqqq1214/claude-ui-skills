# Guided skill task validation

Date: 2026-10-29. Demo baseline: the chapter-registry version. The coding agent read `SKILL.md`, selected the scenario guides, and performed three requested adaptations in a temporary copy of the demo. The shipped demo and public components were not changed by the exercise.

This validates guided execution, not automatic skill discovery, independent-agent selection or general performance on unseen tasks. The agent already had repository context. The skill was not installed globally for this exercise.

## Tasks and observed results

| Request | Guides selected | Adaptation and checks |
| --- | --- | --- |
| Add a reset action for the switch, checkbox, slider and primary segmented selection; preserve playback speed. | [Controls](../references/components/controls.md), [segmented control](../references/components/segmented.md) | Added a chapter-owned action using the existing state setters. Changed each selection, reset it, and confirmed the chosen playback speed was retained. |
| Add a pinned Design conversation; retain keyboard reordering, chapter-switch persistence and Restore order. | [Sidebar modes and pinned order](../references/components/modes.md) | Added a stable-ID item to the sample list. Moved it through the keyboard action menu, switched chapters and returned, then restored the original order. |
| Start with a draft and add Clear draft; retain references and attachments, and return focus to the editor. | [Input and attachments](../references/components/composer.md) | Used `defaultText` and the existing `MentionEditor` handle's `clear()`/`focus()`. Inserted an `@` reference, retained the draft through chapter/language changes, cleared it, and checked editor focus and both attachments. |

All three tasks passed in English and Simplified Chinese: six task/locale cases. The temporary application passed TypeScript checking. Browser checks reported no page errors or external HTTP requests. A file comparison confirmed that only `ControlsChapter.tsx`, `SidebarChapter.tsx` and `ComposerChapter.tsx` changed in the temporary copy; source components, styles and assets were identical to the baseline. The temporary project was removed after verification.

The guides exposed the required state ownership, stable IDs and editor handle without a new general skill rule. An initial test probe used an incorrect attachment selector; it was corrected to the existing attachment data attribute before rerunning all six cases. This was a validation-script correction, not a component defect.

## Repeat the exercise

Use the requests above with a fresh temporary copy of the demo and the skill entrypoint. Have the agent select its references before editing. Check the observable behavior, typecheck the result, and compare changed files against the requested scope. Keep the task-specific buttons and sample data out of the shipped demo unless separately requested.

For a future independent evaluation, supply only the request, skill and demo baseline rather than this result table. Dependency integration is checked separately by the [existing Tailwind host example](../examples/tailwind-host/README.md) and its browser suite.
