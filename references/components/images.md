# Image preview from a thumbnail

Use for: one image that opens from a visible thumbnail and returns to the same place, keeping spatial context. For several images with paging and zoom, use the [gallery](gallery.md).

## Code

[HTML](../../showcase/index.html#images) · [images.js](../../showcase/components/images.js) · [images.css](../../showcase/components/images.css)

- `initImagesDemo()` binds the thumbnail and the dialog.
- `setOpen()` coordinates opening, closing and interruption.

## Parameters

| Part | Value |
| --- | --- |
| Thumbnail | 9px radius; hairline inner ring at 20% |
| Thumbnail press | Frame scales to about .99 and the image clips 2px inward over 60ms ease-out; release takes 450ms `--ease-spring` |
| Preview surface | `.375rem` radius; shadow `0 4px 32px` black 30% plus a .5px ring at 25% |
| Open / close | View Transition, 350ms open and 250ms close, `--ease-snap` |
| Decoration | Radius and shadow animate from the thumbnail's values to the preview's |
| Close button | 24×24px, 6px radius, 16px icon; on coarse pointers 32×32px, 8px radius, 20px icon |
| Close feedback | Hover and focus over 60ms; press scales to .9375 over 60ms ease-out and releases over 450ms `--ease-spring` |

## Rules

- The visible boundary, corners and shadow change together as the image expands.
- Close with Escape, the close button, the image or the backdrop.
- Closing returns into the thumbnail when it is visible; otherwise the preview fades out.
- Keep keyboard focus in the preview. On close, return focus to the opener unless focus has moved to another overlay.

## Check

- [ ] Open and close by each dismissal path
- [ ] Reopen during a close, and close during an open
- [ ] Close with the thumbnail scrolled out of view
- [ ] Focus return, both themes, narrow and short viewports

Related component guides: [component index](../components.md).
