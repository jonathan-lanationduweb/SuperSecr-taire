/**
 * Annuaire des entreprises : sélection mise en avant (accueil),
 * annuaire avec recherche et filtres, fiche entreprise détaillée.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    renderFeatured();
    initDirectory();
    renderCompanyDetail();
  });

  /* Fiche d'annuaire : monogramme à gauche, informations à droite,
     un trait distinctif de l'entreprise, statut de recrutement. */
  function companyCard(company, offerCount) {
    var e = SS.escapeHtml;
    var distinct = (company.avantages && company.avantages[0]) || company.valeurs && company.valeurs[0] || "";
    return '<article class="card company-card' + (offerCount ? " company-card--hiring" : "") + '">' +
      '<div class="company-card__head">' +
        '<span class="logo-bubble" style="background:' + e(company.couleur) + '" aria-hidden="true">' + e(company.initiales) + "</span>" +
        "<div>" +
          "<h3>" + e(company.nom) + "</h3>" +
          '<p class="company-card__meta">' + e(company.secteur) + " · " + e(company.ville) + "</p>" +
        "</div>" +
        (offerCount
          ? '<span class="hiring-flag">Recrute · ' + offerCount + (offerCount > 1 ? " offres" : " offre") + "</span>"
          : '<span class="hiring-flag hiring-flag--off">Annuaire</span>') +
      "</div>" +
      '<p class="company-card__activity">' + e(company.activite) + "</p>" +
      (distinct ? '<p class="company-card__distinct">' + e(distinct) + "</p>" : "") +
      '<div class="company-card__foot">' +
        '<span class="text-muted">' + e(company.taille) + "</span>" +
        '<a class="link-more" href="entreprise-detail.html?id=' + encodeURIComponent(company.id) + '">Voir la fiche</a>' +
      "</div>" +
    "</article>";
  }

  function withOfferCounts(callback) {
    return Promise.all([SS.getCompanies(), SS.getActiveOffers()])
      .then(function (results) {
        var counts = {};
        results[1].forEach(function (o) {
          counts[o.entrepriseId] = (counts[o.entrepriseId] || 0) + 1;
        });
        return callback(results[0], counts, results[1]);
      });
  }

  /* ---- Accueil : entreprises mises en avant ---- */
  function renderFeatured() {
    var container = document.getElementById("featured-companies");
    if (!container) { return; }
    withOfferCounts(function (companies, counts) {
      var featured = companies.slice()
        .sort(function (a, b) { return (counts[b.id] || 0) - (counts[a.id] || 0); })
        .slice(0, 4);
      container.innerHTML = featured.map(function (c) {
        return companyCard(c, counts[c.id] || 0);
      }).join("");
    }).catch(function () { SS.dataError(container); });
  }

  /* ---- Annuaire ---- */
  function initDirectory() {
    var grid = document.getElementById("companies-grid");
    if (!grid) { return; }

    withOfferCounts(function (companies, counts) {
      var form = document.getElementById("directory-form");
      var sectorSelect = document.getElementById("directory-sector");

      /* Alimente la liste des secteurs à partir des données. */
      var sectors = [];
      companies.forEach(function (c) {
        if (sectors.indexOf(c.secteur) === -1) { sectors.push(c.secteur); }
      });
      sectors.sort().forEach(function (s) {
        var option = document.createElement("option");
        option.value = s;
        option.textContent = s;
        sectorSelect.appendChild(option);
      });

      function apply() {
        var name = normalize(document.getElementById("directory-name").value);
        var sector = sectorSelect.value;
        var city = normalize(document.getElementById("directory-city").value);

        var filtered = companies.filter(function (c) {
          if (name && normalize(c.nom + " " + c.activite).indexOf(name) === -1) { return false; }
          if (sector && c.secteur !== sector) { return false; }
          if (city && normalize(c.ville + " " + c.departement).indexOf(city) === -1) { return false; }
          return true;
        });

        var countEl = document.getElementById("directory-count");
        countEl.textContent = filtered.length === 0 ? "Aucune entreprise trouvée"
          : filtered.length + (filtered.length > 1 ? " entreprises référencées" : " entreprise référencée");

        grid.innerHTML = filtered.length
          ? filtered.map(function (c) { return companyCard(c, counts[c.id] || 0); }).join("")
          : '<div class="empty-state"><h3>Aucun résultat</h3><p>Modifiez votre recherche ou effacez les filtres.</p></div>';
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        apply();
      });
      form.querySelectorAll("input, select").forEach(function (input) {
        input.addEventListener("change", apply);
        input.addEventListener("input", apply);
      });

      apply();
    }).catch(function () { SS.dataError(grid); });
  }

  /* ---- Fiche entreprise ---- */
  function renderCompanyDetail() {
    var root = document.getElementById("company-detail");
    if (!root) { return; }
    var id = SS.param("id");

    withOfferCounts(function (companies, counts, offers) {
      var company = companies.find(function (c) { return c.id === id; }) || companies[0];
      var e = SS.escapeHtml;

      document.title = company.nom + " – recrutement | SuperSecrétaire";

      document.getElementById("company-name").textContent = company.nom;
      document.getElementById("company-activity").textContent = company.activite;
      document.getElementById("company-sector").textContent = company.secteur;
      document.getElementById("company-description").textContent = company.description;

      var bubble = document.getElementById("company-bubble");
      bubble.style.background = company.couleur;
      bubble.textContent = company.initiales;

      var dl = document.getElementById("company-coordinates");
      dl.innerHTML =
        "<div><dt>Adresse</dt><dd>" + e(company.adresse) + "</dd></div>" +
        "<div><dt>Ville</dt><dd>" + e(company.ville) + " — " + e(company.departement) + "</dd></div>" +
        "<div><dt>Téléphone</dt><dd>" + e(company.telephone) + "</dd></div>" +
        '<div><dt>Site internet</dt><dd><a href="' + e(company.siteWeb) + '" rel="nofollow">' + e(company.siteWeb.replace("https://", "")) + "</a></dd></div>" +
        "<div><dt>Effectif</dt><dd>" + e(company.taille) + "</dd></div>";

      fillList("company-values", company.valeurs);
      fillList("company-benefits", company.avantages);

      var contactBtn = document.getElementById("company-contact-btn");
      if (contactBtn) {
        contactBtn.href = "contact.html?entreprise=" + encodeURIComponent(company.nom);
      }

      /* Offres actuellement disponibles. */
      var offersBox = document.getElementById("company-offers");
      var companyOffers = offers.filter(function (o) { return o.entrepriseId === company.id; });
      companyOffers.forEach(function (o) { o.couleur = company.couleur; });
      offersBox.innerHTML = companyOffers.length
        ? companyOffers.map(SS.offerCard).join("")
        : '<div class="empty-state"><h3>Pas d\'offre en ce moment</h3>' +
          "<p>Cette entreprise n'a pas d'offre active aujourd'hui. Revenez bientôt ou " +
          '<a href="offres.html">consultez les autres offres</a>.</p></div>';

      /* « Ses conseils et savoir-faire » : publications de l'entreprise. */
      renderCompanyKnowhow(company);
    }).catch(function () { SS.dataError(root.querySelector(".container") || root); });
  }

  function renderCompanyKnowhow(company) {
    var section = document.getElementById("company-knowhow-section");
    var box = document.getElementById("company-knowhow");
    if (!section || !box || typeof SS.getKnowhow !== "function") { return; }
    SS.getKnowhow().then(function (items) {
      var mine = items.filter(function (p) {
        return p.auteur && p.auteur.entrepriseId === company.id;
      });
      if (!mine.length) { return; }
      section.hidden = false;
      box.innerHTML = mine.map(SS.knowhowCard).join("");
    }).catch(function () { /* section simplement absente en cas d'erreur */ });
  }

  function fillList(id, items) {
    var el = document.getElementById(id);
    if (el && items) {
      el.innerHTML = items.map(function (item) {
        return "<li>" + SS.escapeHtml(item) + "</li>";
      }).join("");
    }
  }

  function normalize(text) {
    return (text || "").toString().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
})();

