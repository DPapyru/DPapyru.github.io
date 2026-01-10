// Early theme initialization to avoid FOUC (Flash Of Unstyled Content).
// Must be loaded in <head> (non-defer).
(function () {
  try {
    var storageKey = 'theme';
    var savedTheme = localStorage.getItem(storageKey);
    var prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = savedTheme || (prefersDark ? 'dark' : 'light');

    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  } catch (_) {
    // Ignore any storage/privacy errors.
  }
})();

