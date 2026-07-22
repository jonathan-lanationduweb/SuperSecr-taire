/**
 * Navigation : menu mobile et mise en évidence de la page courante.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("main-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });

      /* Fermer le menu mobile après un clic sur un lien. */
      nav.addEventListener("click", function (event) {
        if (event.target.closest("a")) {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });

      /* Fermer avec la touche Échap. */
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && nav.classList.contains("is-open")) {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.focus();
        }
      });
    }

    /* Marquer le lien de la page courante (aria-current). */
    var current = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(function (link) {
      var href = link.getAttribute("href");
      if (href === current ||
          (href === "offres.html" && current === "offre-detail.html") ||
          (href === "entreprises.html" && current === "entreprise-detail.html") ||
          (href === "savoir-faire.html" &&
            (current === "savoir-faire-detail.html" || current === "publier-savoir-faire.html")) ||
          (href === "blog.html" && current === "article.html")) {
        link.setAttribute("aria-current", "page");
      }
    });
  });
})();
