import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        lng: localStorage.getItem('i18nextLng') || 'en',
        interpolation: {
            escapeValue: false,
        },
        resources: {
            en: {
                translation: {
                    "profile": {
                        "title": "Admin Profile",
                        "subtitle": "Manage your personal information and security settings.",
                        "personal_info": "Informations",
                        "edit": "Edit",
                        "first_name": "First Name",
                        "last_name": "Last Name",
                        "email": "Professional Email",
                        "phone": "Phone Number",
                        "position": "Position",
                        "cancel": "Cancel",
                        "save": "Save changes",
                        "save_success": "Changes saved successfully.",
                        "preferences": "Preferences",
                        "language": "Interface Language",
                        "language_desc": "Choose the default display language.",
                        "dark_mode": "Dark Mode",
                        "dark_mode_desc": "Adjust the application's appearance.",
                        "security": "Security",
                        "2fa": "Two-Factor Authentication (2FA)",
                        "2fa_desc": "Your account is secure. 2FA is currently active.",
                        "manage": "Manage",
                        "change_password": "Change Password",
                        "current_password": "Current Password",
                        "new_password": "New Password",
                        "confirm_password": "Confirm New Password",
                        "update_password": "Update Password"
                    },
                    "sidebar": {
                        "dashboard": "Dashboard",
                        "stock": "Stock",
                        "customers": "Customers",
                        "products": "Products",
                        "orders": "Orders",
                        "reports": "Reports",
                        "analysis": "Analysis",
                        "profile": "Profile",
                        "logout": "Log out",
                        "logout_confirm": "Logout Confirmation",
                        "logout_desc": "Are you sure you want to log out? You will need to log back in to access your inventory."
                    },
                    "login": {
                        "title": "Admin Login",
                        "subtitle": "Please authenticate to access the management dashboard.",
                        "email_label": "Email or Username",
                        "password_label": "Password",
                        "remember_me": "Remember me",
                        "forgot_password": "Forgot password?",
                        "submit": "Log In",
                        "help": "Help",
                        "protected_text": "Protected by reCAPTCHA and subject to privacy policy.",
                        "copyright": "© 2025 M4STERPIECE. All rights reserved.",
                        "error_incorrect": "Incorrect email or password.",
                        "error_generic": "Error connecting. Please try again.",
                        "error_invalid_response": "Invalid server response (missing token).",
                        "error_network": "Unable to contact the server."
                    }
                }
            },
            fr: {
                translation: {
                    "profile": {
                        "title": "Profil Administrateur",
                        "subtitle": "Gérez vos informations personnelles et vos paramètres de sécurité.",
                        "personal_info": "Informations",
                        "edit": "Modifier",
                        "first_name": "Prénom",
                        "last_name": "Nom",
                        "email": "Email Professionnel",
                        "phone": "Numéro de téléphone",
                        "position": "Poste",
                        "cancel": "Annuler",
                        "save": "Enregistrer les modifications",
                        "save_success": "Modifications enregistrées avec succès.",
                        "preferences": "Préférences",
                        "language": "Langue de l'interface",
                        "language_desc": "Choisissez la langue d'affichage par défaut.",
                        "dark_mode": "Mode Sombre",
                        "dark_mode_desc": "Ajuster l'apparence de l'application.",
                        "security": "Sécurité",
                        "2fa": "Authentification à deux facteurs (2FA)",
                        "2fa_desc": "Votre compte est sécurisé. La 2FA est actuellement activée.",
                        "manage": "Gérer",
                        "change_password": "Changer de mot de passe",
                        "current_password": "Mot de passe actuel",
                        "new_password": "Nouveau mot de passe",
                        "confirm_password": "Confirmer le nouveau mot de passe",
                        "update_password": "Mettre à jour le mot de passe"
                    },
                    "sidebar": {
                        "dashboard": "Tableau de bord",
                        "stock": "Stock",
                        "customers": "Clients",
                        "products": "Produits",
                        "orders": "Commandes",
                        "reports": "Rapports",
                        "analysis": "Analyses",
                        "profile": "Profil",
                        "logout": "Déconnexion",
                        "logout_confirm": "Confirmation de déconnexion",
                        "logout_desc": "Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre inventaire."
                    },
                    "login": {
                        "title": "Connexion Admin",
                        "subtitle": "Veuillez vous authentifier pour accéder au tableau de bord de gestion.",
                        "email_label": "Email ou Nom d'utilisateur",
                        "password_label": "Mot de passe",
                        "remember_me": "Se souvenir de moi",
                        "forgot_password": "Mot de passe oublié ?",
                        "submit": "Se connecter",
                        "help": "Aide",
                        "protected_text": "Protégé par reCAPTCHA et soumis aux règles de confidentialité.",
                        "copyright": "© 2025 M4STERPIECE. Tous droits réservés.",
                        "error_incorrect": "Email ou mot de passe incorrect.",
                        "error_generic": "Erreur lors de la connexion. Réessayez.",
                        "error_invalid_response": "Réponse invalide du serveur (token manquant).",
                        "error_network": "Impossible de contacter le serveur."
                    }
                }
            },
            mg: {
                translation: {
                    "profile": {
                        "title": "Mombamomba ny Mpandrindra",
                        "subtitle": "Tantano ny mombamomba anao sy ny firafitry ny fiarovana.",
                        "personal_info": "Mombamomba ny Tena",
                        "edit": "Hanova",
                        "first_name": "Anarana",
                        "last_name": "Fanampin'anarana",
                        "email": "Imailaka fiasana",
                        "phone": "Laharana finday",
                        "position": "Andraikitra",
                        "cancel": "Hanafoana",
                        "save": "Hitehirizana ny fanovana",
                        "save_success": "Voatahiry soa aman-tsara ny fanovana.",
                        "preferences": "Safidy",
                        "language": "Fiteny ampiasaina",
                        "language_desc": "Safidio ny fiteny hita amin'ny fampiharana.",
                        "dark_mode": "Sary Mainty",
                        "dark_mode_desc": "Ahitsio ny fisehon'ny fampiharana.",
                        "security": "Fiarovana",
                        "2fa": "Fanamarinana indroa (2FA)",
                        "2fa_desc": "Voaaro ny kaontinao. Ampitahaina amin'izao ny 2FA.",
                        "manage": "Hitantana",
                        "change_password": "Hanova teny miafina",
                        "current_password": "Teny miafina ankehitriny",
                        "new_password": "Teny miafina vaovao",
                        "confirm_password": "Hamarino ny teny miafina vaovao",
                        "update_password": "Hanavao ny teny miafina"
                    },
                    "sidebar": {
                        "dashboard": "Tabilao",
                        "stock": "Tahiry",
                        "customers": "Mpanjifa",
                        "products": "Entana",
                        "orders": "Kaomandy",
                        "reports": "Tatitra",
                        "analysis": "Famakafakana",
                        "profile": "Mombamomba",
                        "logout": "Hiala",
                        "logout_confirm": "Fanamarinana ny fialana",
                        "logout_desc": "Tena te hiala ve ianao? Mila miditra indray ianao vao afaka mijery ny tahiry."
                    },
                    "login": {
                        "title": "Fidiran'ny Mpandraharaha",
                        "subtitle": "Azafady midira mba hahafahanao mampiasa ny tabilao fitantanana.",
                        "email_label": "Imailaka na Anarana solon'anarana",
                        "password_label": "Teny miafina",
                        "remember_me": "Tsarovy aho",
                        "forgot_password": "Hadinoko ny teny miafina?",
                        "submit": "Hiditra",
                        "help": "Fanampiana",
                        "protected_text": "Voaaron'ny reCAPTCHA ary manaraka ny fitsipika momba ny fiarovana ny angona.",
                        "copyright": "© 2025 M4STERPIECE. Zo rehetra voatokana.",
                        "error_incorrect": "Diso ny imailaka na ny teny miafina.",
                        "error_generic": "Nisy olana teo amin'ny fidirana. Andramo indray.",
                        "error_invalid_response": "Valiny tsy mitombina avy amin'ny mpizara (tsy hita ny token).",
                        "error_network": "Tsy afaka mifandray amin'ny mpizara."
                    }
                }
            }
        }
    });

export default i18n;
