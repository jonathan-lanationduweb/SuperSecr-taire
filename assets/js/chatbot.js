/**
 * Chatbot d'accompagnement « Clémence » — présent sur toutes les pages.
 * Version démonstration : réponses prédéfinies (SCENARIOS). L'architecture
 * sépare l'interface (rendu, ouverture/fermeture) de la source des réponses,
 * afin de pouvoir brancher plus tard une API d'IA via
 * APP_CONFIG.api.endpoints.chatbot sans toucher à l'interface.
 */
(function () {
  "use strict";

  /* Réponses prédéfinies. `answer` accepte du HTML simple (liens internes). */
  var SCENARIOS = [
    {
      id: "emploi",
      label: "Je recherche un emploi",
      answer: "Très bien ! Vous pouvez chercher parmi toutes nos offres " +
        'depuis la page <a href="offres.html">Offres d\'emploi</a> : mot-clé, ville, ' +
        "type de contrat, télétravail… Aucune inscription n'est nécessaire pour " +
        "consulter les offres et candidater."
    },
    {
      id: "publier",
      label: "Je souhaite publier une offre",
      answer: "Avec plaisir ! Rendez-vous sur la page " +
        '<a href="publier-offre.html">Publier une offre</a> : un formulaire en ' +
        "6 étapes simples vous guide (entreprise, poste, description, contrat, " +
        "aperçu, validation). Votre offre apparaît ensuite dans votre " +
        '<a href="espace-entreprise.html">espace entreprise</a>.'
    },
    {
      id: "renouveler",
      label: "Comment renouveler une offre ?",
      answer: "Lorsqu'une offre arrive à expiration, un bouton " +
        "« Renouveler pour 10 € » apparaît dans votre " +
        '<a href="espace-entreprise.html">espace entreprise</a>. Le renouvellement ' +
        "prolonge la publication de 60 jours. Dans ce prototype, le paiement est " +
        "entièrement simulé : aucune somme n'est réellement débitée."
    },
    {
      id: "contact",
      label: "Contacter SuperSecrétaire",
      answer: "Notre équipe vous répond du lundi au vendredi, de 9h à 18h. " +
        'Le plus simple est de passer par le <a href="contact.html">formulaire de ' +
        "contact</a>. Nous répondons généralement sous un jour ouvré."
    },
    {
      id: "conseils",
      label: "Des conseils pour ma candidature",
      answer: "Bonne idée ! Consultez nos <a href=\"blog.html\">conseils et articles</a> : " +
        "CV, préparation d'entretien, télétravail, fiches métiers… " +
        "De quoi mettre toutes les chances de votre côté."
    }
  ];

  var WELCOME = "Bonjour, je suis Clémence 👋 Je réponds aux questions les plus " +
    "courantes sur SuperSecrétaire. Choisissez un sujet ci-dessous — et si je ne " +
    "sais pas répondre, l'équipe prend le relais par le formulaire de contact.";

  var FOLLOW_UP = "Puis-je vous aider sur un autre sujet ?";

  document.addEventListener("DOMContentLoaded", function () {
    injectWidget();

    var toggle = document.getElementById("chatbot-toggle");
    var panel = document.getElementById("chatbot-panel");
    var closeBtn = document.getElementById("chatbot-close");
    var messages = document.getElementById("chatbot-messages");
    var shortcuts = document.getElementById("chatbot-shortcuts");
    var opened = false;

    function setOpen(open) {
      panel.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      panel.setAttribute("aria-hidden", open ? "false" : "true");
      if (open && !opened) {
        opened = true;
        addMessage(WELCOME, "bot");
      }
      if (open) { panel.querySelector(".chatbot-shortcuts button").focus(); }
    }

    toggle.addEventListener("click", function () {
      setOpen(!panel.classList.contains("is-open"));
    });
    closeBtn.addEventListener("click", function () {
      setOpen(false);
      toggle.focus();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && panel.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    shortcuts.addEventListener("click", function (event) {
      var btn = event.target.closest("button[data-scenario]");
      if (!btn) { return; }
      var scenario = SCENARIOS.find(function (s) { return s.id === btn.getAttribute("data-scenario"); });
      if (!scenario) { return; }
      addMessage(scenario.label, "user");
      /* Point de branchement futur : remplacer getAnswer par un appel API. */
      getAnswer(scenario).then(function (answer) {
        addMessage(answer, "bot", true);
        addMessage(FOLLOW_UP, "bot");
      });
    });

    /* Source des réponses — actuellement locale, plus tard : API d'IA. */
    function getAnswer(scenario) {
      return Promise.resolve(scenario.answer);
    }

    function addMessage(content, from, isHtml) {
      var msg = document.createElement("div");
      msg.className = "chatbot-msg chatbot-msg--" + (from === "bot" ? "bot" : "user");
      if (isHtml) { msg.innerHTML = content; } else { msg.textContent = content; }
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }
  });

  /* Construit le widget une seule fois, injecté sur chaque page. */
  function injectWidget() {
    var wrapper = document.createElement("div");
    wrapper.innerHTML =
      '<button type="button" id="chatbot-toggle" class="chatbot-toggle" ' +
        'aria-expanded="false" aria-controls="chatbot-panel" aria-label="Ouvrir l\'assistance en ligne">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
          'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3 8.9 8.9 0 0 1-3.2-.6L3 21l1.9-5.5a8 8 0 0 1-1.4-4A8.4 8.4 0 0 1 12 3.2a8.4 8.4 0 0 1 9 8.3z"/>' +
        "</svg>" +
        '<span class="chatbot-toggle__label">Besoin d\'aide&nbsp;?</span>' +
      "</button>" +
      '<section id="chatbot-panel" class="chatbot-panel" aria-hidden="true" aria-label="Assistant SuperSecrétaire">' +
        '<div class="chatbot-header">' +
          '<span class="avatar" aria-hidden="true">C</span>' +
          "<div><h2>Clémence</h2>" +
          "<p>Assistante SuperSecrétaire — réponses automatiques</p></div>" +
          '<button type="button" id="chatbot-close" class="chatbot-close" aria-label="Fermer l\'assistance">×</button>' +
        "</div>" +
        '<div id="chatbot-messages" class="chatbot-messages" aria-live="polite"></div>' +
        '<div id="chatbot-shortcuts" class="chatbot-shortcuts">' +
          SCENARIOS.map(function (s) {
            return '<button type="button" data-scenario="' + s.id + '">' + s.label + "</button>";
          }).join("") +
        "</div>" +
      "</section>";
    while (wrapper.firstChild) {
      document.body.appendChild(wrapper.firstChild);
    }
  }
})();
