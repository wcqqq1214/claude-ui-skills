# Skill and consumer validation

## Guided demo exercise

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

For an independent evaluation, supply only the request, skill and application baseline rather than this result table. The separate evaluation below follows that approach.

## Fresh consumer installation

On 2026-10-29, the [Tailwind host example](../examples/tailwind-host/README.md) and the complete `src/` tree were copied into a new temporary directory outside the repository. It had no `node_modules` or lockfile. `npm install --no-audit --no-fund` installed 41 packages into that application's own dependency directory, then `npm run build` passed TypeScript checking and production compilation. No dependency symlink to this repository was used. The normal npm cache was allowed; this was a fresh project install, not a cold-cache benchmark or security audit.

The environment was Node 26.12.0 and npm 11.20.0. Resolved versions included React/React DOM 19.3.1, Tailwind 4.3.3, TypeScript 7.0.2 and Vite 8.3.5. These results describe that resolution, not every version allowed by the manifest ranges.

Both `npm run dev` and `npm run preview` served working pages. Browser interaction verified the notification switch with Space, segmented selection with ArrowRight, theme changes preserving both settings, and a 320px viewport with no horizontal document overflow. The local icon and sprite rendered, and the inspected browser logs contained no warnings or errors.

## Fresh-context skill task

A separate agent received no conversation history or earlier evaluation results. Its inputs were a read-only copy of the skill entry, guides and linked implementation files, a temporary application based on the Tailwind example, and this request:

> Add Save settings to the existing settings page. Each save should show a local confirmation containing the current notification switch and Preview/Code values. Keep recent saves as separate notices, allow individual dismissal and Clear notices, preserve settings and notices through theme changes, support keyboard interaction and a 320px layout, and make no backend calls.

The agent selected the component index, notification guide, visual foundations and integration guide, then read the linked notification component, styles and demo caller. It used the existing component API and changed only the application's `main.tsx` and `style.css`. It installed its own dependencies with `npm ci` using the fresh consumer's lockfile, and its build passed. File comparisons confirmed that the skill snapshot and both applications' copied public source trees were unchanged.

The parent task separately exercised the built result in a browser at desktop and 320px widths:

- Enter saved the initial on/preview values. Later saves recorded off/code, including a separate entry for repeated identical settings.
- Switching theme retained the current settings and all three notices. Dismissing them exposed saves 3, 2 and 1 in order; the oldest retained its original on/preview snapshot.
- Dismissing the last notice returned focus to Save settings. Clear notices removed multiple notices and retained focus on its own button.
- Both themes rendered at 320px without horizontal overflow. The inspected browser logs contained no warnings or errors.

The agent identified one wording ambiguity: a rule said that repeated messages reuse an entry, while the API deduplicates by `key`. The [notification guide](../references/components/recovery.md) now states that identical text without a key creates separate notices in stack mode. No component behavior changed.

This is one explicitly invoked skill task in a fresh agent context, not an automatic-discovery test, a benchmark across models or evidence of performance on arbitrary applications. Screenshots, resolved lockfiles and the task-specific application files remain local; temporary dependency trees and servers were removed after verification. The task-specific controls were not added to the shipped example or demo.
