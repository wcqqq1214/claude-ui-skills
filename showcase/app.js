'use strict';
// Initialize once, after translated markup and all component definitions exist.
(() => {
  initTypeDemo();
  initControlsDemo();
  initSegmentedDemo();
  initComposerDemo();
  initFeedbackDemo();
  initWorkspaceDemo();
  const showToast = initMicroDemo();
  initImagesDemo();
  initReadingDemo();
  initMenusDemo();
  initModesDemo();
  initTasksDemo();
  initRecoveryDemo(showToast);
  initGalleryDemo();
})();
