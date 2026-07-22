/**
 * Blog : liste avec catégories et recherche, articles récents (accueil),
 * article détaillé, articles associés et inscription newsletter (simulée).
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    renderRecentArticles();
    initBlogList();
    renderArticle();
    initNewsletter();
  });

  function articleCard(article) {
    var e = SS.escapeHtml;
    return '<article class="card article-card">' +
      '<img src="' + e(article.image) + '" alt="' + e(article.imageAlt) + '" loading="lazy">' +
      '<div class="article-card__body">' +
        '<span class="badge badge--accent">' + e(article.categorie) + "</span>" +
        '<h3><a href="article.html?id=' + encodeURIComponent(article.id) + '">' + e(article.titre) + "</a></h3>" +
        "<p>" + e(article.resume) + "</p>" +
        '<div class="article-card__meta">' +
          "<span>" + e(SS.formatDate(article.date)) + "</span>" +
          "<span>" + e(article.tempsLecture) + " de lecture</span>" +
        "</div>" +
      "</div>" +
    "</article>";
  }

  /* Article mis en avant (image + texte côte à côte). */
  function articleFeatured(article) {
    var e = SS.escapeHtml;
    return '<article class="article-featured">' +
      '<img src="' + e(article.image) + '" alt="' + e(article.imageAlt) + '" loading="lazy">' +
      '<div class="article-featured__body">' +
        '<p class="article-meta-line"><span class="cat">' + e(article.categorie) + "</span>" +
          "<span>" + e(SS.formatDate(article.date)) + "</span><span>" + e(article.tempsLecture) + " de lecture</span></p>" +
        '<h3><a href="article.html?id=' + encodeURIComponent(article.id) + '">' + e(article.titre) + "</a></h3>" +
        "<p>" + e(article.resume) + "</p>" +
      "</div>" +
    "</article>";
  }

  /* Article compact (vignette + titre). */
  function articleCompact(article) {
    var e = SS.escapeHtml;
    return '<article class="article-compact">' +
      '<img src="' + e(article.image) + '" alt="' + e(article.imageAlt) + '" loading="lazy">' +
      "<div>" +
        '<p class="article-meta-line"><span class="cat">' + e(article.categorie) + "</span><span>" + e(article.tempsLecture) + "</span></p>" +
        '<h3><a href="article.html?id=' + encodeURIComponent(article.id) + '">' + e(article.titre) + "</a></h3>" +
      "</div>" +
    "</article>";
  }
  SS.articleFeatured = articleFeatured;
  SS.articleCompact = articleCompact;

  /* ---- Accueil : un article vedette + deux compacts ---- */
  function renderRecentArticles() {
    var featuredBox = document.getElementById("home-article-featured");
    var sideBox = document.getElementById("home-articles-side");
    var legacy = document.getElementById("recent-articles");
    if (!featuredBox && !legacy) { return; }
    SS.getArticles().then(function (articles) {
      var recent = articles.slice()
        .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
      if (featuredBox && sideBox) {
        featuredBox.innerHTML = articleFeatured(recent[0]);
        sideBox.innerHTML = recent.slice(1, 4).map(articleCompact).join("");
      } else if (legacy) {
        legacy.innerHTML = recent.slice(0, 3).map(articleCard).join("");
      }
    }).catch(function () { SS.dataError(featuredBox || legacy); });
  }

  /* ---- Liste du blog ---- */
  function initBlogList() {
    var grid = document.getElementById("articles-grid");
    if (!grid) { return; }

    SS.getArticles().then(function (articles) {
      var state = { category: "", query: "" };
      var catContainer = document.getElementById("blog-categories");

      /* Boutons de catégories générés à partir des données. */
      var categories = [];
      articles.forEach(function (a) {
        if (categories.indexOf(a.categorie) === -1) { categories.push(a.categorie); }
      });
      catContainer.innerHTML =
        '<button type="button" class="chip" data-cat="" aria-pressed="true">Tous les articles</button>' +
        categories.map(function (c) {
          return '<button type="button" class="chip" data-cat="' + SS.escapeHtml(c) + '" aria-pressed="false">' + SS.escapeHtml(c) + "</button>";
        }).join("");

      catContainer.addEventListener("click", function (event) {
        var btn = event.target.closest("button[data-cat]");
        if (!btn) { return; }
        state.category = btn.getAttribute("data-cat");
        catContainer.querySelectorAll("button").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        render();
      });

      var searchInput = document.getElementById("blog-search-input");
      searchInput.addEventListener("input", function () {
        state.query = searchInput.value.trim().toLowerCase();
        render();
      });
      document.getElementById("blog-search-form").addEventListener("submit", function (event) {
        event.preventDefault();
        render();
      });

      function render() {
        var filtered = articles.filter(function (a) {
          if (state.category && a.categorie !== state.category) { return false; }
          if (state.query) {
            var haystack = (a.titre + " " + a.resume + " " + a.categorie).toLowerCase();
            if (haystack.indexOf(state.query) === -1) { return false; }
          }
          return true;
        }).sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

        if (!filtered.length) {
          grid.innerHTML = '<div class="empty-state"><h3>Aucun article trouvé</h3><p>Essayez un autre mot-clé ou une autre catégorie.</p></div>';
          return;
        }

        /* Espace éditorial : le plus récent en grand, la suite en mosaïque. */
        grid.innerHTML = articleFeatured(filtered[0]) +
          (filtered.length > 1
            ? '<div class="articles-mosaic">' + filtered.slice(1).map(articleCard).join("") + "</div>"
            : "");
      }

      render();
    }).catch(function () { SS.dataError(grid); });
  }

  /* ---- Article détaillé ---- */
  function renderArticle() {
    var body = document.getElementById("article-body");
    if (!body) { return; }
    var id = SS.param("id");

    SS.getArticles().then(function (articles) {
      var article = articles.find(function (a) { return a.id === id; }) || articles[0];
      var e = SS.escapeHtml;

      document.title = article.titre + " | SuperSecrétaire";

      document.getElementById("article-category").textContent = article.categorie;
      document.getElementById("article-title").textContent = article.titre;
      document.getElementById("article-meta").innerHTML =
        "<span>Par " + e(article.auteur) + "</span>" +
        "<span>" + e(SS.formatDate(article.date)) + "</span>" +
        "<span>" + e(article.tempsLecture) + " de lecture</span>";

      /* Le contenu HTML provient de notre propre fichier de données. */
      body.innerHTML =
        '<img src="' + e(article.image) + '" alt="' + e(article.imageAlt) + '">' +
        article.contenu;

      /* Articles associés : même catégorie d'abord, puis les plus récents. */
      var related = articles.filter(function (a) {
        return a.id !== article.id && a.categorie === article.categorie;
      });
      articles.forEach(function (a) {
        if (a.id !== article.id && related.indexOf(a) === -1) { related.push(a); }
      });
      var relatedBox = document.getElementById("related-articles");
      if (relatedBox) {
        relatedBox.innerHTML = related.slice(0, 3).map(articleCard).join("");
      }

      /* Liste latérale « à lire aussi ». */
      var asideList = document.getElementById("aside-articles");
      if (asideList) {
        asideList.innerHTML = related.slice(0, 4).map(function (a) {
          return '<li><a href="article.html?id=' + encodeURIComponent(a.id) + '">' +
            e(a.titre) + "<span>" + e(a.categorie) + " — " + e(a.tempsLecture) + "</span></a></li>";
        }).join("");
      }

      injectArticleSchema(article);
    }).catch(function () { SS.dataError(body); });
  }

  /* Données structurées Article (SEO). */
  function injectArticleSchema(article) {
    var schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.titre,
      "datePublished": article.date,
      "author": { "@type": "Organization", "name": article.auteur },
      "publisher": { "@type": "Organization", "name": "SuperSecrétaire" },
      "description": article.resume
    };
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /* ---- Newsletter (simulée) ---- */
  function initNewsletter() {
    document.querySelectorAll("[data-newsletter-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[type='email']");
        if (!input.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
          input.focus();
          return;
        }
        /* Démo : en production, appel à APP_CONFIG.api.endpoints.newsletter. */
        form.innerHTML = '<p class="notice notice--success" role="status">' +
          "Merci ! Votre inscription est bien prise en compte (démonstration : aucun e-mail ne sera envoyé).</p>";
      });
    });
  }
})();
