/**
 * Espace entreprise (démonstration) : statistiques, liste des offres
 * de l'entreprise et actions (consulter, modifier, désactiver, renouveler).
 * L'entreprise « connectée » est le compte de démonstration défini
 * dans APP_CONFIG.demoCompany ; les modifications sont conservées
 * dans le stockage local du navigateur.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.getElementById("dashboard");
    if (!root) { return; }

    var session = SS.store.get(APP_CONFIG.storage.session, null);
    var welcome = document.getElementById("dashboard-welcome");
    if (welcome) {
      var name = session && session.contact ? session.contact : APP_CONFIG.demoCompany.contact;
      welcome.textContent = "Bonjour " + name + " !";
    }

    renderDashboard();
    renderActivity();
  });

  /* Activité récente, déduite des actions conservées dans ce navigateur. */
  function renderActivity() {
    var box = document.getElementById("dashboard-activity");
    if (!box) { return; }
    var events = [];
    SS.store.get(APP_CONFIG.storage.payments, []).forEach(function (p) {
      events.push({ date: p.date, texte: "Renouvellement d'une offre pour " + p.montant + " € (démonstration)" });
    });
    SS.store.get(APP_CONFIG.storage.customOffers, []).forEach(function (o) {
      events.push({ date: o.datePublication, texte: "Publication de l'offre « " + o.titre + " »" });
    });
    events.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    box.innerHTML = events.length
      ? "<ul>" + events.slice(0, 4).map(function (ev) {
          return "<li><span>" + SS.escapeHtml(SS.formatDate(ev.date)) + "</span>" +
            SS.escapeHtml(ev.texte) + "</li>";
        }).join("") + "</ul>"
      : '<p class="text-muted">Aucune action récente dans ce navigateur. Publiez ou renouvelez une offre pour voir votre activité ici.</p>';
  }

  function getCompanyOffers() {
    return SS.getOffers().then(function (offers) {
      return offers.filter(function (o) {
        return o.entrepriseId === APP_CONFIG.demoCompany.id;
      });
    });
  }

  function renderDashboard() {
    getCompanyOffers().then(function (offers) {
      var active = offers.filter(function (o) { return o.statut === "active"; });
      var expired = offers.filter(function (o) { return o.statut === "expiree"; });
      var disabled = offers.filter(function (o) { return o.statut === "desactivee"; });
      var applications = offers.reduce(function (sum, o) {
        return sum + SS.fakeApplicationCount(o.id);
      }, 0);

      setText("stat-active", active.length);
      setText("stat-expired", expired.length + disabled.length);
      setText("stat-applications", applications);

      renderTable(offers);
    }).catch(function () {
      SS.dataError(document.getElementById("dashboard-table-wrap"));
    });
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) { el.textContent = String(value); }
  }

  function statusBadge(offer) {
    if (offer.statut === "active") {
      return '<span class="badge badge--remote">Active</span>';
    }
    if (offer.statut === "desactivee") {
      return '<span class="badge badge--neutral">Désactivée</span>';
    }
    return '<span class="badge badge--expired">Expirée</span>';
  }

  function renderTable(offers) {
    var tbody = document.getElementById("dashboard-offers");
    if (!tbody) { return; }
    var e = SS.escapeHtml;

    if (!offers.length) {
      tbody.innerHTML = '<tr><td colspan="5">' +
        '<div class="empty-state"><h3>Aucune offre pour le moment</h3>' +
        '<p><a href="publier-offre.html">Publiez votre première offre</a> pour recevoir des candidatures.</p></div>' +
        "</td></tr>";
      return;
    }

    tbody.innerHTML = offers.map(function (o) {
      var actions =
        '<a class="btn btn-ghost btn-sm" href="offre-detail.html?id=' + encodeURIComponent(o.id) + '">Consulter</a>' +
        '<a class="btn btn-outline btn-sm" href="publier-offre.html?modifier=' + encodeURIComponent(o.id) + '">Modifier</a>';
      if (o.statut === "active") {
        actions += '<button type="button" class="btn btn-danger btn-sm" data-action="disable" data-id="' + e(o.id) + '">Désactiver</button>';
      } else if (o.statut === "desactivee") {
        actions += '<button type="button" class="btn btn-primary btn-sm" data-action="enable" data-id="' + e(o.id) + '">Réactiver</button>';
      } else {
        actions += '<a class="btn btn-accent btn-sm" href="paiement.html?offre=' + encodeURIComponent(o.id) + '">Renouveler pour 10&nbsp;€</a>';
      }

      return "<tr>" +
        '<td data-label="Offre"><strong>' + e(o.titre) + "</strong><br><span class='text-muted'>" + e(o.ville) + " — " + e(o.contrat) + "</span></td>" +
        '<td data-label="Statut">' + statusBadge(o) + "</td>" +
        '<td data-label="Expire le">' + e(SS.formatDate(o.dateExpiration)) + "</td>" +
        '<td data-label="Candidatures">' + SS.fakeApplicationCount(o.id) + "</td>" +
        '<td><div class="row-actions">' + actions + "</div></td>" +
      "</tr>";
    }).join("");

    /* Actions désactiver / réactiver. */
    tbody.querySelectorAll("button[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-id");
        var action = btn.getAttribute("data-action");
        var overrides = SS.store.get(APP_CONFIG.storage.offerOverrides, {});
        overrides[id] = overrides[id] || {};
        overrides[id].statut = action === "disable" ? "desactivee" : "active";
        if (action === "enable") {
          /* Réactivation : on repousse l'expiration si elle est déjà passée. */
          var next = new Date();
          next.setDate(next.getDate() + APP_CONFIG.payment.renewal.durationDays);
          overrides[id].dateExpiration = next.toISOString().slice(0, 10);
        }
        SS.store.set(APP_CONFIG.storage.offerOverrides, overrides);
        renderDashboard();
      });
    });
  }
})();
