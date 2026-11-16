// Runs before first paint: marks that JavaScript is on and applies a saved theme so dark mode never flashes light.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    var theme = localStorage.getItem('theme');
    if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
  } catch (error) {
    // Storage is blocked: follow the system theme.
  }
})();
