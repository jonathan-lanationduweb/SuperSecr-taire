/**
 * Configuration centrale de SuperSecrétaire.
 * Toutes les futures URL d'API sont regroupées ici : lors du passage
 * à WordPress (ou à une passerelle de paiement réelle), il suffira de
 * remplacer les valeurs `null` par les vraies adresses.
 * Aucune clé d'API réelle ne doit jamais être stockée dans ce fichier.
 */
window.APP_CONFIG = {
  siteName: "SuperSecrétaire",

  /* Sources de données de démonstration (fichiers JSON locaux). */
  data: {
    offers: "data/offers.json",
    companies: "data/companies.json",
    articles: "data/articles.json",
    savoirFaire: "data/savoir-faire.json",
    guidedSearch: "data/guided-search.json"
  },

  /* Futures API — à connecter plus tard. Exemple pour WordPress :
     baseUrl: "https://www.supersecretaire.fr/wp-json" */
  api: {
    baseUrl: null,
    endpoints: {
      offers: "/wp/v2/offre",
      companies: "/wp/v2/entreprise",
      articles: "/wp/v2/posts",
      applications: "/supersecretaire/v1/candidatures",
      contact: "/supersecretaire/v1/contact",
      newsletter: "/supersecretaire/v1/newsletter",
      chatbot: "/supersecretaire/v1/chatbot",
      savoirFaire: "/wp/v2/savoir-faire",
      knowhowRatings: "/supersecretaire/v1/savoir-faire/notes",
      knowhowComments: "/supersecretaire/v1/savoir-faire/commentaires",
      knowhowReports: "/supersecretaire/v1/savoir-faire/signalements",
      guidedSearch: "/supersecretaire/v1/recherche-guidee",
      recommendations: "/supersecretaire/v1/recommandations",
      geocoding: null,   /* ex. API Adresse (adresse.data.gouv.fr) */
      companiesDirectory: null /* ex. API Recherche d'entreprises */
    }
  },

  /* Paiement simulé — structure prête pour Stripe / WooCommerce. */
  payment: {
    provider: "demo",          /* remplacer par "stripe", "woocommerce"… */
    publicKey: null,           /* jamais de clé réelle dans le prototype */
    renewal: {
      price: 10,
      currency: "EUR",
      durationDays: 60,
      label: "Renouvellement d'une offre d'emploi (60 jours)"
    }
  },

  /* Clés du stockage local du navigateur. */
  storage: {
    session: "ss_session",
    customOffers: "ss_custom_offers",
    offerOverrides: "ss_offer_overrides",
    payments: "ss_payments",
    customKnowhow: "ss_sf_publications",
    knowhowRatings: "ss_sf_notes",
    knowhowComments: "ss_sf_commentaires",
    knowhowViews: "ss_sf_vues",
    knowhowReports: "ss_sf_signalements"
  },

  /* Compte entreprise de démonstration pour l'espace entreprise. */
  demoCompany: {
    id: "fiduciaire-bellecour",
    nom: "Fiduciaire Bellecour",
    contact: "Claire Fontanel"
  }
};
