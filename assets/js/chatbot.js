/**
 * Chatbot « Clémence » v2 — présent sur toutes les pages.
 * Un assistant vivant : indicateur de frappe animé, messages qui
 * apparaissent en douceur, invitation discrète après quelques secondes,
 * et mini-quiz de la recherche guidée monté directement dans la
 * conversation (via SS.guidedSearchMount).
 *
 * Les réponses restent prédéfinies (SCENARIOS) : l'interface est séparée
 * de la source des réponses pour brancher plus tard une API d'IA
 * (APP_CONFIG.api.endpoints.chatbot) sans toucher au composant.
 */
(function () {
  "use strict";

  var SEEN_KEY = "ss_chat_vu";

  /* Réponses prédéfinies. `answer` accepte du HTML simple (liens internes). */
  var SCENARIOS = [
    {
      id: "emploi",
      label: "Je recherche un emploi",
      answer: "Très bien ! Vous pouvez chercher parmi toutes nos offres " +
        'depuis la page <a href="offres.html">Offres d\'emploi</a> : mot-clé, ville, ' +
        "type de contrat, télétravail… Aucune inscription n'est nécessaire pour " +
        "consulter les offres et candidater. Et pensez au marque-page ★ pour " +
        "retrouver vos offres préférées !"
    },
    {
      id: "publier",
      label: "Je souhaite publier une offre",
      answer: "Avec plaisir ! Rendez-vous sur la page " +
        '<a href="publier-offre.html">Publier une offre</a> : un formulaire en ' +
        "6 étapes simples vous guide, avec un aperçu avant mise en ligne et " +
        "une sauvegarde en brouillon. Votre offre apparaît ensuite dans votre " +
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
      label: "Contacter l'équipe",
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

  var WELCOME = "Bonjour, je suis Clémence 👋 Posez-moi une question ci-dessous — " +
    "ou faites le mini-quiz : je vous oriente en quelques réponses.";

  var FOLLOW_UP = "Puis-je vous aider sur un autre sujet ?";

  var messages, shortcuts, panel, toggle;
  var opened = false;
  var busy = false;

  document.addEventListener("DOMContentLoaded", function () {
    injectWidget();

    toggle = document.getElementById("chatbot-toggle");
    panel = document.getElementById("chatbot-panel");
    var closeBtn = document.getElementById("chatbot-close");
    messages = document.getElementById("chatbot-messages");
    shortcuts = document.getElementById("chatbot-shortcuts");

    function setOpen(open) {
      panel.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      panel.setAttribute("aria-hidden", open ? "false" : "true");
      if (open) {
        clearNudge();
        try { sessionStorage.setItem(SEEN_KEY, "1"); } catch (e) { /* ignoré */ }
        if (!opened) {
          opened = true;
          botSay(WELCOME);
        }
        var firstBtn = panel.querySelector(".chatbot-shortcuts button");
        if (firstBtn) { firstBtn.focus(); }
      }
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

    /* Invitation discrète : petit rebond + point après quelques secondes,
       une seule fois par session. */
    var alreadySeen = false;
    try { alreadySeen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch (e) { /* ignoré */ }
    if (!alreadySeen) {
      setTimeout(function () {
        if (!panel.classList.contains("is-open")) {
          toggle.classList.add("is-nudge");
          var dot = toggle.querySelector(".chatbot-dot");
          if (dot) { dot.hidden = false; }
        }
      }, 6000);
    }

    function clearNudge() {
      toggle.classList.remove("is-nudge");
      var dot = toggle.querySelector(".chatbot-dot");
      if (dot) { dot.hidden = true; }
    }

    /* Raccourcis : questions prédéfinies + mini-quiz. */
    shortcuts.addEventListener("click", function (event) {
      if (busy) { return; }
      var quizBtn = event.target.closest("[data-chatbot-quiz]");
      if (quizBtn) { startQuizInChat(); return; }

      var btn = event.target.closest("button[data-scenario]");
      if (!btn) { return; }
      var scenario = SCENARIOS.find(function (s) { return s.id === btn.getAttribute("data-scenario"); });
      if (!scenario) { return; }
      addMessage(scenario.label, "user");
      /* Point de branchement futur : remplacer getAnswer par un appel API. */
      getAnswer(scenario).then(function (answer) {
        return botSay(answer, true);
      }).then(function () {
        return botSay(FOLLOW_UP);
      });
    });

    /* Source des réponses — actuellement locale, plus tard : API d'IA. */
    function getAnswer(scenario) {
      return Promise.resolve(scenario.answer);
    }

    /* ---- Mini-quiz dans la conversation ---- */
    function startQuizInChat() {
      addMessage("Je veux être guidé(e) 🎯", "user");
      if (typeof SS.guidedSearchMount !== "function") {
        botSay('Bien sûr ! Rendez-vous sur la <a href="recherche-guidee.html">recherche guidée</a> : quelques questions et je vous oriente.', true);
        return;
      }
      botSay("Avec plaisir ! Répondez à quelques questions — une à la fois, et vous pouvez revenir en arrière à tout moment.").then(function () {
        shortcuts.hidden = true;
        var quizBox = document.createElement("div");
        quizBox.className = "chatbot-quiz";
        quizBox.id = "chatbot-quiz";
        panel.appendChild(quizBox);
        SS.guidedSearchMount(quizBox, {
          onQuit: function () {
            quizBox.remove();
            shortcuts.hidden = false;
            botSay("J'espère que ces suggestions vous aident ! " + FOLLOW_UP);
          }
        });
        quizBox.scrollIntoView({ block: "nearest" });
      });
    }
  });

  /* Bulle « Clémence écrit… » puis message : c'est ce qui rend le bot vivant. */
  function botSay(content, isHtml) {
    busy = true;
    var typing = document.createElement("div");
    typing.className = "chatbot-msg chatbot-msg--bot chatbot-typing";
    typing.setAttribute("aria-label", "Clémence est en train d'écrire");
    typing.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var delay = reduced ? 80 : 500 + Math.min(600, content.length * 4);

    return new Promise(function (resolve) {
      setTimeout(function () {
        typing.remove();
        addMessage(content, "bot", isHtml);
        busy = false;
        resolve();
      }, delay);
    });
  }

  function addMessage(content, from, isHtml) {
    var msg = document.createElement("div");
    msg.className = "chatbot-msg chatbot-msg--" + (from === "bot" ? "bot" : "user");
    if (isHtml) { msg.innerHTML = content; } else { msg.textContent = content; }
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

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
        '<span class="chatbot-dot" hidden aria-hidden="true"></span>' +
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
          '<button type="button" class="chatbot-quiz-btn" data-chatbot-quiz>🎯 Trouver ce qu\'il me faut — mini-quiz</button>' +
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
