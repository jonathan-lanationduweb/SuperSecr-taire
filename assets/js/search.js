/**
 * Moteur de recherche du hero (page d'accueil) :
 * redirige vers la page des offres avec les critères en paramètres d'URL.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("hero-search-form");
    if (!form) { return; }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var params = new URLSearchParams();
      var keyword = form.querySelector("#search-keyword").value.trim();
      var location = form.querySelector("#search-location").value.trim();
      if (keyword) { params.set("q", keyword); }
      if (location) { params.set("lieu", location); }
      var query = params.toString();
      window.location.href = "offres.html" + (query ? "?" + query : "");
    });
  });
})();
