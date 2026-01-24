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
      green: true,
      blue: true,
      purple: true,
      orange: true,
      red: true,
      cyan: true,
      black: true,
      white: true
    };

    var legacyMap = {
      forest: 'green',
      ocean: 'blue',
      grape: 'purple',
      amber: 'orange',
      crimson: 'red',
      dim: 'cyan'
    };

    var accent = localStorage.getItem('accent');
    if (legacyMap[accent]) accent = legacyMap[accent];
    if (!allowedAccents[accent]) accent = 'green';
    document.documentElement.setAttribute('data-accent', accent);
  } catch (_) {
    // Ignore any storage/privacy errors.
  }
})();
