/**
 * Paiement simulé du renouvellement d'une offre (10 €).
 * Aucune donnée bancaire réelle n'est demandée ni conservée : les champs
 * carte sont volontairement factices et la « transaction » est simulée.
 * La structure (résumé, montant, validation, confirmation) est prête à
 * être branchée sur Stripe ou WooCommerce via APP_CONFIG.payment.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("payment-form");
    if (!form) { return; }

    var offerId = SS.param("offre");
    var renewal = APP_CONFIG.payment.renewal;
    var offer = null;

    /* Résumé de l'offre à renouveler. */
    SS.getOffers().then(function (offers) {
      offer = offers.find(function (o) { return o.id === offerId; });
      /* Sans identifiant valide, on illustre avec la première offre expirée. */
      if (!offer) {
        offer = offers.find(function (o) {
          return o.entrepriseId === APP_CONFIG.demoCompany.id && o.statut !== "active";
        }) || offers[0];
      }
      var e = SS.escapeHtml;
      document.getElementById("payment-offer").innerHTML =
        "<div><dt>Offre</dt><dd>" + e(offer.titre) + "</dd></div>" +
        "<div><dt>Lieu</dt><dd>" + e(offer.ville) + "</dd></div>" +
        "<div><dt>Statut actuel</dt><dd>" + (offer.statut === "active" ? "Active" : "Expirée / désactivée") + "</dd></div>" +
        "<div><dt>Prestation</dt><dd>" + e(renewal.label) + "</dd></div>";
    }).catch(function () {
      SS.dataError(document.getElementById("payment-offer"));
    });

    /* Montant affiché depuis la configuration. */
    document.querySelectorAll("[data-renewal-price]").forEach(function (el) {
      el.textContent = renewal.price + " €";
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!SS.validateForm(form)) { return; }

      var submitBtn = document.getElementById("payment-submit");
      submitBtn.disabled = true;
      submitBtn.textContent = "Paiement en cours…";

      /* Simulation d'un délai de transaction. */
      setTimeout(function () {
        if (offer) {
          /* Mise à jour du statut de l'offre dans le stockage local. */
          var overrides = SS.store.get(APP_CONFIG.storage.offerOverrides, {});
          var next = new Date();
          next.setDate(next.getDate() + renewal.durationDays);
          overrides[offer.id] = overrides[offer.id] || {};
          overrides[offer.id].statut = "active";
          overrides[offer.id].dateExpiration = next.toISOString().slice(0, 10);
          SS.store.set(APP_CONFIG.storage.offerOverrides, overrides);

          /* Trace de la « transaction » de démonstration. */
          var payments = SS.store.get(APP_CONFIG.storage.payments, []);
          payments.push({
            offre: offer.id,
            montant: renewal.price,
            devise: renewal.currency,
            date: new Date().toISOString(),
            mode: form.querySelector("input[name='payment-method']:checked").value,
            demo: true
          });
          SS.store.set(APP_CONFIG.storage.payments, payments);
        }

        document.getElementById("payment-step-form").hidden = true;
        var success = document.getElementById("payment-success");
        success.hidden = false;
        success.focus();
      }, 1200);
    });
  });
})();
