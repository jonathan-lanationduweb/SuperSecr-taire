/**
 * Connexion / création de compte entreprise (simulées).
 * Aucun vrai mot de passe n'est vérifié ni stocké : la « session »
 * de démonstration est un simple indicateur en stockage local.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var tabs = document.querySelectorAll(".auth-tabs button");
    if (!tabs.length) { return; }

    var panels = {
      login: document.getElementById("panel-login"),
      register: document.getElementById("panel-register")
    };

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.setAttribute("aria-selected", t === tab ? "true" : "false"); });
        var target = tab.getAttribute("data-panel");
        panels.login.hidden = target !== "login";
        panels.register.hidden = target !== "register";
      });
    });

    /* Connexion simulée. */
    var loginForm = document.getElementById("login-form");
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!SS.validateForm(loginForm)) { return; }
      SS.store.set(APP_CONFIG.storage.session, {
        entreprise: APP_CONFIG.demoCompany.nom,
        contact: APP_CONFIG.demoCompany.contact,
        email: document.getElementById("login-email").value.trim(),
        demo: true
      });
      window.location.href = "espace-entreprise.html";
    });

    /* Création de compte simulée. */
    var registerForm = document.getElementById("register-form");
    registerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!SS.validateForm(registerForm)) { return; }
      SS.store.set(APP_CONFIG.storage.session, {
        entreprise: document.getElementById("register-company").value.trim(),
        contact: document.getElementById("register-name").value.trim(),
        email: document.getElementById("register-email").value.trim(),
        demo: true
      });
      window.location.href = "espace-entreprise.html";
    });
  });
})();
