# Image preview from a thumbnail

Use this for one image that opens from a visible thumbnail and returns to the same location, preserving spatial context.

## Read the running code

[HTML](../../showcase/index.html#images) · [JS](../../showcase/components/images.js) · [CSS](../../showcase/components/images.css)

`initImagesDemo()` binds the thumbnail and dialog; `setOpen()` coordinates opening, closing and interruption. The shared `.image-close` style is in [style.css](../../showcase/style.css).

## Interaction

- Open the thumbnail to expand the image, with its visible boundary, corners and shadow changing together.
- Close with Escape, the close button, the image or the backdrop. Return to the thumbnail when it is visible; otherwise fade out.
- Keep keyboard focus in the preview; return it to the opener on close unless focus has moved to another overlay. Reduced motion opens and closes immediately.

Use the separate [gallery](gallery.md) for multi-image navigation and zoom.
