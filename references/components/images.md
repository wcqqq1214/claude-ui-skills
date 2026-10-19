# Image preview from a thumbnail

Use for: one image that opens from a visible thumbnail and returns to the same place, keeping spatial context. For several images with paging and zoom, use the [gallery](gallery.md).

## Code

[ImagePreview.tsx](../../src/components/media/ImagePreview.tsx) · [native transition controller](../../src/components/media/imagePreviewTransition.ts) · [images.css](../../src/styles/images.css) · [React demo](../../demo/chapters/ImagesChapter.tsx)

Import `ImagePreview` from `src/index.ts` and the shared [style entry](../../src/styles/index.css); see [integration](../../demo/README.md). The host supplies image URLs, alt text and labels. `previewSrc`/`previewAlt` optionally differ from the thumbnail. `thumbnailStyle` supports contain/scale-down letterboxing; `className` styles the trigger. `ref` exposes `open()`/`close()` and `onOpenChange` reports user/programmatic changes without firing on mount. Set `active={false}` when the host hides a chapter.

```tsx
import { ImagePreview } from './src';
import './src/styles/index.css';

<ImagePreview
  src="/landscape.svg"
  alt="Mountains under a clay-colored sun"
  openLabel="Enlarge image"
  dialogLabel="Image preview"
  actionsLabel="Image actions"
  closeLabel="Close preview"
/>
```

React owns the trigger, native dialog and translated content. The isolated controller measures the visible source, coordinates native View Transitions and restores focus. Each instance has its own transition name and temporary stylesheet; it does not set global html classes or suppress the host's named elements. Unsupported View Transitions fall back to the same native dialog behavior. Unmount, inactivity and pagehide cancel pending updates and remove temporary styles.

An uncached preview loads and decodes before opening, so its transition has intrinsic image dimensions. The page remains interactive while waiting. `close()`, inactivity, pagehide and unmount cancel that opening request; `onOpenChange` reports actual display changes. A failed resource leaves the thumbnail available, and a URL change invalidates the old resource before preparing the replacement.

## Parameters

| Part | Value |
| --- | --- |
| Thumbnail | 9px radius; hairline inner ring at 20% |
| Thumbnail press | Frame scales to about .99 and the image clips 2px inward over 60ms ease-out; release takes 450ms `--cui-ease-spring` |
| Preview surface | `.375rem` radius; shadow `0 4px 32px` black 30% plus a .5px ring at 25% |
| Open / close | View Transition, 350ms open and 250ms close, `--cui-ease-snap` |
| Decoration | Radius and shadow animate from the thumbnail's values to the preview's |
| Close button | 24×24px, 6px radius, 16px icon; on coarse pointers 32×32px, 8px radius, 20px icon |
| Close feedback | Hover and focus over 60ms; press scales to .9375 over 60ms ease-out and releases over 450ms `--cui-ease-spring` |

## Rules

- The visible boundary, corners and shadow change together as the image expands.
- Close with Escape, the close button, the image or the backdrop.
- Closing returns into the thumbnail when it is visible; otherwise the preview fades out.
- Keep keyboard focus in the preview. On close, return focus to the opener unless focus has moved to another overlay.

## Check

The [independent consumer suite](../../tests/react-images.browser.cjs) exercises all dismissal paths, native transition timing/corners/letterbox crop, keyboard focus, rapid interruption, multiple instances, offscreen-source fade, late callbacks after unmount, fallback and English/Chinese light/dark demos at 1280/390/320px with fine/coarse pointers.

Local adaptations and limits: [coverage](../../docs/coverage.md#images).
