/**
 * Formulaire de contact (envoi simulé).
 * En production : envoi vers APP_CONFIG.api.endpoints.contact.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contact-form");
    if (!form) { return; }

    /* Pré-remplissage du sujet depuis une fiche entreprise. */
    var company = SS.param("entreprise");
    if (company) {
      var subject = document.getElementById("contact-subject");
      subject.value = "entreprise";
      document.getElementById("contact-message").value =
        "Bonjour, je souhaite contacter l'entreprise " + company + " au sujet de…";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!SS.validateForm(form)) { return; }
      form.hidden = true;
      var success = document.getElementById("contact-success");
      success.hidden = false;
      success.focus();
    });
  });
})();
