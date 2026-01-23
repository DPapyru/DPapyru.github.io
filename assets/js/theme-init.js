// Early theme initialization to avoid FOUC (Flash Of Unstyled Content).
// Must be loaded in <head> (non-defer).
(function () {
  try {
    // This site is now dark-mode only.
    document.documentElement.setAttribute('data-theme', 'dark');
    // Clear any previously saved preference to avoid conflicts.
    localStorage.removeItem('theme');

    // Accent preset (still dark-mode only). Set early to avoid FOUC.
    var allowedAccents = {
      forest: true,
      ocean: true,
      grape: true,
      amber: true,
      crimson: true,
      dim: true
    };

    var accent = localStorage.getItem('accent');
    if (!allowedAccents[accent]) accent = 'forest';
    document.documentElement.setAttribute('data-accent', accent);
  } catch (_) {
    // Ignore any storage/privacy errors.
  }
})();
