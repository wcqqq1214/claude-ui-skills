'use strict';
// Initialize once, after translated markup and all component definitions exist.
(() => {
  initTypeDemo();
  initControlsDemo();
  initComposerDemo();
  initFeedbackDemo();
  initWorkspaceDemo();
  initReadingFlowDemo();
  const showToast = initMicroDemo();
  initImagesDemo();
  initReadingDemo();
  initMenusDemo();
  initModesDemo();
  initTasksDemo();
  initRecoveryDemo(showToast);
  initGalleryDemo();
})();
