---
name: claude-ui-skills
description: Build or refine Claude-inspired UI, frontend interactions, and motion using scenario guides and runnable frontend code. Use for Claude-style chat presentation, controls, menus, panels, typography and animation in an existing frontend.
---

# Claude UI Skills

Choose a scenario, read its guide and the frontend code it links, then adapt the design to the target app. The guides reference the demo’s actual HTML, JS and CSS.

## Choose and read

Resolve paths relative to this installed skill directory, not the target app's working directory. Start with the [component index](references/components.md), then read only the requested chapter. For themes, typography, icons or shared surfaces, read [visual foundations](references/visual.md).

Read the chapter's markup, state transitions, styles and named consumers together. The component index identifies shared runtime dependencies. These are page-lifetime examples, not drop-in framework packages. Keep the target stack and existing component ownership; a framework adaptation owns listener, observer, timer and animation cleanup.

## Adapt within scope

- Work only on UI, frontend presentation and motion. Preserve unrelated behavior. Do not add backend behavior, authentication, tool execution, reconnection or feature-flag changes. Reduced-motion adaptation is outside this skill and demo’s scope.
- Preserve relationships between geometry, timing, selection, focus and visibility. Separate those relationships from sample text, page layout and demonstration controls. Map shared tokens to the target theme rather than copying the entire showcase shell.
- Keep local adaptations and unsupported effects explicit. The demo does not include code-editor cursor or selection effects or a standalone static-code state example. Timeline collapse is a local interaction example.
- Additional source collection requires an explicit request. Stop if a safety or approval review blocks it.

## Verify and report

Test the changed interaction's trigger, state transition, exit and focus return, including relevant narrow-container and language changes. For numerical thresholds, test the controlling boundary. When shared icon styles change, check static and dynamic consumers in controls, inline text and overlays for alignment, clipping, row height and hit-area changes. Run the target project's applicable checks and use a browser when available; report unperformed visual or physical-gesture checks.

Report the frontend files/functions used, local adaptations, checks and remaining uncertainty. Do not claim pixel parity, complete Claude runtime verification, GPU acceleration or performance gains from static code or a working demo.

Open [the demo](showcase/index.html) directly, or serve the skill root with `python3 -m http.server 8766 --bind 127.0.0.1` and browse `/showcase/`. All 13 demo chapters run locally without sending data or executing tools.
