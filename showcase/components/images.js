'use strict';
function initImagesDemo() {
  const imageDialog = $('#imageDialog'),
    origin = $('#imageOrigin'),
    largeImage = $('#largeImage');
  let imagePhase = 'closed',
    imageRevision = 0,
    imageAnimation = null;

  async function openImage() {
    if (imagePhase !== 'closed' || imageDialog.open) return;
    const revision = ++imageRevision;
    imagePhase = 'opening';
    const rect = origin.getBoundingClientRect();
    imageDialog.showModal();
    await nextFrame();
    if (revision !== imageRevision || !imageDialog.open) return;
    const dest = largeImage.getBoundingClientRect();
    origin.style.visibility = 'hidden';
    const animation = largeImage.animate(
      [
        { transform: imageTransform(rect, dest), borderRadius: '7px' },
        { transform: 'none', borderRadius: '7px' }
      ],
      { duration: 350, easing: snap }
    );
    imageAnimation = animation;
    await animation.finished.catch(() => {});
    if (revision !== imageRevision) return;
    imageAnimation = null;
    imagePhase = 'open';
  }
  async function closeImage() {
    if (imagePhase === 'closed' || imagePhase === 'closing' || !imageDialog.open) return;
    const revision = ++imageRevision;
    imagePhase = 'closing';
    // Read the rendered transform before cancelling the entering animation.
    const currentTransform = getComputedStyle(largeImage).transform;
    imageAnimation?.cancel();
    imageAnimation = null;
    const from = largeImage.getBoundingClientRect(),
      to = origin.getBoundingClientRect();
    const visible =
      origin.isConnected &&
      to.width > 0 &&
      to.height > 0 &&
      to.bottom > 0 &&
      to.top < innerHeight &&
      to.right > 0 &&
      to.left < innerWidth;
    const frames = visible
      ? [{ transform: currentTransform }, { transform: imageTransform(to, from) }]
      : [
          { transform: currentTransform, opacity: 1 },
          { transform: currentTransform, opacity: 0 }
        ];
    const animation = largeImage.animate(frames, { duration: 250, easing: snap, fill: 'forwards' });
    imageAnimation = animation;
    await animation.finished.catch(() => {});
    if (revision !== imageRevision) return;
    imageDialog.close();
    animation.cancel();
    imageAnimation = null;
    origin.style.visibility = '';
    imagePhase = 'closed';
    if (origin.isConnected) origin.focus({ preventScroll: true });
  }
  origin.onclick = openImage;
  $('#closeImage').onclick = closeImage;
  largeImage.onclick = closeImage;
  imageDialog.onclick = (e) => {
    if (e.target === imageDialog) closeImage();
  };
  imageDialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeImage();
  });
}
