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
      var offerCount = counts[company.id] || 0;

      document.title = company.nom + " – recrutement | SuperSecrétaire";

      document.getElementById("company-name").textContent = company.nom;
      document.getElementById("company-activity").textContent = company.activite;
      document.getElementById("company-description").textContent = company.description;

      var bubble = document.getElementById("company-bubble");
      bubble.style.background = company.couleur;
      bubble.textContent = company.initiales;

      /* Badges du hero : secteur + statut de recrutement. */
      var heroBadges = document.getElementById("company-hero-badges");
      if (heroBadges) {
        heroBadges.innerHTML =
          '<span class="badge badge--accent">' + e(company.secteur) + "</span>" +
          (offerCount
            ? '<span class="badge badge--remote">Recrute actuellement</span>'
            : "");
      }

      /* Ligne de méta : ville, effectif, offres. */
      var meta = document.getElementById("company-hero-meta");
      if (meta) {
        var offerLabel = offerCount
          ? offerCount + (offerCount > 1 ? " offres en ligne" : " offre en ligne")
          : "Aucune offre en ce moment";
        meta.innerHTML =
          "<li><span aria-hidden=\"true\">📍</span>" + e(company.ville) + " · " + e(company.departement) + "</li>" +
          "<li><span aria-hidden=\"true\">👥</span>" + e(company.taille) + "</li>" +
          "<li><span aria-hidden=\"true\">💼</span>" + e(offerLabel) + "</li>";
      }

      /* Chiffres clés. */
      var stats = document.getElementById("company-stats");
      if (stats) {
        stats.innerHTML = [
          statTile(company.taille.replace(/\s*salariés?/i, ""), "salariés"),
          statTile(String(offerCount), offerCount > 1 ? "offres actives" : "offre active"),
          statTile(company.ville, "en " + company.departement.replace(/\s*\(.*\)/, "")),
          statTile(company.secteur, "secteur d'activité")
        ].join("");
      }

      /* Coordonnées : carte à icônes, plus aérée. */
      var coords = document.getElementById("company-coordinates");
      if (coords) {
        coords.innerHTML =
          coordRow("📍", "Adresse", e(company.adresse)) +
          coordRow("🏙️", "Ville", e(company.ville) + " — " + e(company.departement)) +
          coordRow("☎️", "Téléphone", e(company.telephone)) +
          coordRow("✉️", "E-mail", e(company.email)) +
          coordRow("🌐", "Site internet",
            '<a href="' + e(company.siteWeb) + '" rel="nofollow">' + e(company.siteWeb.replace("https://", "")) + "</a>") +
          coordRow("🏢", "Secteur", e(company.secteur)) +
          coordRow("👥", "Effectif", e(company.taille));
      }

      /* Valeurs → cartes ; avantages → cartes à icône. */
      renderValueCards("company-values", company.valeurs);
      renderPerkCards("company-benefits", company.avantages);

      var contactHref = "contact.html?entreprise=" + encodeURIComponent(company.nom);
      ["company-contact-btn", "cta-contact-btn"].forEach(function (bid) {
        var b = document.getElementById(bid);
        if (b) { b.href = contactHref; }
      });

      /* Offres actuellement disponibles — même composant que la page Offres. */
      var offersBox = document.getElementById("company-offers");
      var companyOffers = offers.filter(function (o) { return o.entrepriseId === company.id; });
      companyOffers.forEach(function (o) { o.couleur = company.couleur; });
      offersBox.innerHTML = companyOffers.length
        ? companyOffers.map(SS.offerCard).join("")
        : '<div class="empty-state"><h3>Pas d\'offre en ce moment</h3>' +
          "<p>Cette entreprise n'a pas d'offre active aujourd'hui. Revenez bientôt ou " +
          '<a href="offres.html">consultez les autres offres</a>.</p></div>';

      /* Sans offre : le CTA « Postuler » invite plutôt à contacter. */
      if (!companyOffers.length) {
        var ctaOffers = document.getElementById("cta-offers-btn");
        if (ctaOffers) {
          ctaOffers.textContent = "Voir toutes les offres";
          ctaOffers.href = "offres.html";
        }
      }

      /* « Ses conseils et savoir-faire » : publications de l'entreprise. */
      renderCompanyKnowhow(company);
    }).catch(function () { SS.dataError(root.querySelector(".container") || root); });
  }

  function statTile(value, label) {
    var e = SS.escapeHtml;
    return '<div class="stat-tile"><strong>' + e(value) + "</strong><span>" + e(label) + "</span></div>";
  }

  function coordRow(icon, label, valueHtml) {
    return '<li class="company-coords__row">' +
      '<span class="company-coords__icon" aria-hidden="true">' + icon + "</span>" +
      '<span class="company-coords__body"><span class="company-coords__label">' + label + "</span>" +
      '<span class="company-coords__value">' + valueHtml + "</span></span></li>";
  }

  function renderValueCards(id, values) {
    var el = document.getElementById(id);
    if (!el || !values) { return; }
    var e = SS.escapeHtml;
    el.innerHTML = values.map(function (v) {
      return '<div class="value-card"><span class="value-card__check" aria-hidden="true">✓</span>' +
        "<p>" + e(v) + "</p></div>";
    }).join("");
  }

  /* Icône déduite du libellé de l'avantage (sobre, sans surcharge). */
  function perkIcon(text) {
    var t = (text || "").toLowerCase();
    if (/t[ée]l[ée]travail|distance|remote/.test(t)) { return "🏠"; }
    if (/mutuelle|sant[ée]|pr[ée]voyance/.test(t)) { return "🩺"; }
    if (/formation|mont[ée]e|comp[ée]tence/.test(t)) { return "🎓"; }
    if (/parking|v[ée]lo|transport|m[ée]tro|acc[èe]s/.test(t)) { return "🚉"; }
    if (/horaire|planning|temps|flex/.test(t)) { return "🗓️"; }
    if (/13|prime|salaire|r[ée]mun[ée]ration|ticket|repas/.test(t)) { return "💶"; }
    if (/locaux|bureau|espace|cadre/.test(t)) { return "🏢"; }
    if (/[ée]quipe|ambiance|convivial/.test(t)) { return "🤝"; }
    return "✓";
  }

  function renderPerkCards(id, perks) {
    var el = document.getElementById(id);
    if (!el || !perks) { return; }
    var e = SS.escapeHtml;
    el.innerHTML = perks.map(function (p) {
      return '<div class="perk-card"><span class="perk-card__icon" aria-hidden="true">' +
        perkIcon(p) + "</span><span>" + e(p) + "</span></div>";
    }).join("");
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

