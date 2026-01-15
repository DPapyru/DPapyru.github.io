// Early theme initialization to avoid FOUC (Flash Of Unstyled Content).
// Must be loaded in <head> (non-defer).
(function () {
  try {
    // This site is now dark-mode only.
    document.documentElement.setAttribute('data-theme', 'dark');
    // Clear any previously saved preference to avoid conflicts.
    localStorage.removeItem('theme');
  } catch (_) {
    // Ignore any storage/privacy errors.
  }
})();
