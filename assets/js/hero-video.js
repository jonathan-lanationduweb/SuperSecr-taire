/**
 * Vidéo du hero (page d'accueil) : élément purement décoratif.
 * Aucun contrôle utilisateur — lecture automatique, muette, en boucle.
 * Source HD ou SD selon l'écran. Si l'utilisateur préfère réduire les
 * animations, la vidéo ne démarre pas et le poster reste affiché.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var heroVideo = document.getElementById("hero-video");
    if (!heroVideo) { return; }

    heroVideo.muted = true;
    heroVideo.defaultMuted = true;

    /* Mouvement réduit : pas de source chargée, le poster suffit. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      heroVideo.removeAttribute("autoplay");
      return;
    }

    heroVideo.src = window.innerWidth < 700
      ? heroVideo.getAttribute("data-src-sd")
      : heroVideo.getAttribute("data-src-hd");

    /* Reprend la lecture si le navigateur l'a interrompue. */
    var ensurePlayback = function () {
      if (heroVideo.paused) {
        heroVideo.play().catch(function () {
          /* Autoplay bloqué : le poster reste visible. */
        });
      }
    };

    ensurePlayback();
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) { ensurePlayback(); }
    });
  });
})();
