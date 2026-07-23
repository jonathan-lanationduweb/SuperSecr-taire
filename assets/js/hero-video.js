/**
 * Vidéo du hero (page d'accueil) : source HD ou SD selon l'écran,
 * lecture automatique silencieuse sauf préférence de mouvement réduit
 * (le poster reste alors affiché), bouton Lire/Suspendre accessible.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var heroVideo = document.getElementById("hero-video");
    if (!heroVideo) { return; }

    var videoToggle = document.getElementById("hero-video-toggle");
    var wantsReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    heroVideo.src = window.innerWidth < 700
      ? heroVideo.getAttribute("data-src-sd")
      : heroVideo.getAttribute("data-src-hd");

    function setVideoState(playing) {
      if (videoToggle) {
        videoToggle.setAttribute("aria-pressed", playing ? "true" : "false");
        videoToggle.textContent = playing ? "Suspendre la vidéo" : "Lire la vidéo";
      }
    }

    if (!wantsReduced) {
      heroVideo.autoplay = true;
      heroVideo.play().then(function () { setVideoState(true); })
        .catch(function () { setVideoState(false); });
    } else {
      setVideoState(false);
    }

    if (videoToggle) {
      videoToggle.addEventListener("click", function () {
        if (heroVideo.paused) {
          heroVideo.play();
          setVideoState(true);
        } else {
          heroVideo.pause();
          setVideoState(false);
        }
      });
    }
  });
})();
