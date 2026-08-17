"use strict";

/* =====================================================
   APPLICATION STARTUP

   Keep this file small. It only starts the shared parts
   of the playground after all HTML and model scripts exist.
===================================================== */

window.AIPlayground = window.AIPlayground || {};

AIPlayground.header.ensurePageSplitStyles();
AIPlayground.header.setup();
AIPlayground.learningTabs.setupAll();
AIPlayground.modelBrowser.createNavigation();
