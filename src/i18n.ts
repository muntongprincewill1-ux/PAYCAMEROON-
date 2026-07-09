import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
const resources = {
  en: {
    translation: {
      "Good morning": "Good morning",
      "Total Balance": "Total Balance",
      "Recent Transactions": "Recent Transactions",
      "See All": "See All",
      "Send": "Send",
      "Withdraw": "Withdraw",
      "Deposit": "Deposit",
      "More": "More",
      "Loading": "Loading...",
      "Settings": "Settings",
      "Theme": "Theme",
      "Language": "Language",
      "Light": "Light",
      "Dark": "Dark",
      "System": "System",
      "Copied": "Copied!",
      "Copy PayCam ID": "Copy PayCam ID",
      "Logout": "Logout",
      "No activity in the system yet.": "No activity in the system yet.",
      "No recent transactions": "No recent transactions"
    }
  },
  fr: {
    translation: {
      "Good morning": "Bonjour",
      "Total Balance": "Solde Total",
      "Recent Transactions": "Transactions Récentes",
      "See All": "Voir Tout",
      "Send": "Envoyer",
      "Withdraw": "Retirer",
      "Deposit": "Dépôt",
      "More": "Plus",
      "Loading": "Chargement...",
      "Settings": "Paramètres",
      "Theme": "Thème",
      "Language": "Langue",
      "Light": "Clair",
      "Dark": "Sombre",
      "System": "Système",
      "Copied": "Copié !",
      "Copy PayCam ID": "Copier l'ID PayCam",
      "Logout": "Déconnexion",
      "No activity in the system yet.": "Aucune activité dans le système pour l'instant.",
      "No recent transactions": "Aucune transaction récente"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
