/**
 * Autocomplétion des villes via l'API Adresse (adresse.data.gouv.fr),
 * service public français, sans clé d'API. Seul le texte saisi est envoyé.
 * En cas d'indisponibilité du service, les champs restent de simples
 * champs texte : aucune fonctionnalité n'en dépend.
 */
(function () {
  "use strict";

  /* Champs « ville » du site susceptibles d'accueillir des suggestions. */
  var CITY_FIELDS = ["search-location", "filter-location", "directory-city", "pub-city", "khp-ville"];

  document.addEventListener("DOMContentLoaded", function () {
    var endpoint = APP_CONFIG.api.endpoints.geocoding;
    if (!endpoint) { return; }

    CITY_FIELDS.forEach(function (id) {
      var input = document.getElementById(id);
      if (!input) { return; }

      var list = document.createElement("datalist");
      list.id = id + "-suggestions";
      input.setAttribute("list", list.id);
      input.setAttribute("autocomplete", "off");
      input.insertAdjacentElement("afterend", list);

      var timer;
      var lastQuery = "";
      input.addEventListener("input", function () {
        clearTimeout(timer);
        var q = input.value.trim();
        if (q.length < 2 || q === lastQuery) { return; }
        timer = setTimeout(function () {
          lastQuery = q;
          fetch(endpoint + "?q=" + encodeURIComponent(q) + "&type=municipality&limit=6&autocomplete=1")
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (data) {
              if (!data || !data.features) { return; }
              list.innerHTML = data.features.map(function (f) {
                var city = f.properties.city || f.properties.name;
                var context = f.properties.context || "";
                return '<option value="' + city.replace(/"/g, "&quot;") + '">' +
                  (context ? city + " — " + context : city) + "</option>";
              }).join("");
            })
            .catch(function () { /* service indisponible : champ libre */ });
        }, 250);
      });
    });
  });
})();
