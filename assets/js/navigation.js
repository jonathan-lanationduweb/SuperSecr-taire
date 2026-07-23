/**
 * Navigation : menu mobile et mise en évidence de la page courante.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("main-nav");
    if (toggle && nav) {
      /* Ouverture / fermeture : aria-expanded + défilement bloqué. */
      var setOpen = function (open) {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.classList.toggle("menu-open", open);
      };

      toggle.addEventListener("click", function () {
        setOpen(!nav.classList.contains("is-open"));
      });

      /* Fermer le menu mobile après un clic sur un lien. */
      nav.addEventListener("click", function (event) {
        if (event.target.closest("a")) { setOpen(false); }
      });

      /* Fermer avec la touche Échap. */
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && nav.classList.contains("is-open")) {
          setOpen(false);
          toggle.focus();
        }
      });
    }

    /* En-tête « vivant » : ombre douce dès que la page défile un peu. */
    var lightHeader = document.querySelector(".site-header--light");
    if (lightHeader) {
      var onScroll = function () {
        lightHeader.classList.toggle("is-scrolled", window.scrollY > 8);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
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
