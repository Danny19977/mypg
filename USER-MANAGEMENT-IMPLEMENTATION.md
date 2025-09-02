# User Management Implementation - French Version

## Vue d'ensemble
Cette implémentation ajoute une fonctionnalité complète de gestion des utilisateurs à l'application TeamOnSite (TOS) avec toutes les interfaces en français et une modal élégante qui glisse depuis la droite de l'écran.

## Fonctionnalités Implémentées

### 1. Page de Gestion des Utilisateurs (User.js)
- **Localisation Française**: Toutes les interfaces sont en français
- **Table des Utilisateurs**: Affichage de tous les utilisateurs avec pagination
- **Bouton "Ajouter Utilisateur"**: Positionné en haut à droite de la page

### 2. Modal de Création d'Utilisateur
La modal apparaît depuis le côté droit de l'écran avec une animation fluide et contient les champs suivants:

#### Champs du Formulaire:
1. **Nom Complet** (text field) - Requis
2. **Email** (text field) - Requis avec validation
3. **Téléphone** (text field) - Requis
4. **Titre** (dropdown) - Options: Support, Manager, Superviseur, Hôtesse - Requis
5. **Mot de Passe** (password) - Requis
6. **Confirmer Mot de Passe** (password) - Requis avec validation de correspondance
7. **Rôle** (information automatique basée sur le titre sélectionné)
8. **Permission** (dropdown) - Options:
   - ALL => "Voir Ajouter Modifier Supprimer"
   - VAE => "Voir Ajouter Modifier"
   - VED => "Voir Modifier Supprimer"
   - VE => "Voir Modifier"
   - VA => "Voir Ajouter"
   - V => "Voir"
9. **Image de Profil** (accès caméra et galerie) - Optionnel
10. **Statut** (toggle button - gris si non sélectionné, coloré si sélectionné)
11. **Pays** (dropdown avec données de la base) - Requis
12. **Province** (dropdown basé sur le pays sélectionné) - Requis
13. **Area** (dropdown basée sur la province sélectionnée) - Requis
14. **Signature** (text field) - Optionnel

#### Données Automatiques Ajoutées:
- **ID** (auto-généré par la base de données)
- **UUID** (généré avec la librairie uuid)
- **created_at** (timestamp automatique)
- **sync** (défini à false par défaut)

### 3. Validation et Soumission
- **Validation en temps réel** pour tous les champs requis
- **Messages d'erreur en français** pour chaque champ
- **Validation email** avec regex
- **Validation de correspondance des mots de passe**
- **Messages de succès/erreur** après soumission

### 4. Intégration API
- **Services API mis à jour** pour supporter les dépendances:
  - Provinces par pays
  - Areas par province
- **Endpoint de création d'utilisateur** correctement intégré
- **Gestion des erreurs** avec messages informatifs

### 5. Styles et UX
- **CSS personnalisé** dans `user-management.css`
- **Animation de modal** glissant depuis la droite
- **Design responsive** pour mobile et desktop
- **Indicateurs de chargement** pendant les opérations
- **Badges colorés** pour les statuts et permissions

## Structure des Fichiers Modifiés/Créés

### Fichiers Frontend:
1. **`src/views/User.js`** - Page principale de gestion des utilisateurs
2. **`src/assets/css/user-management.css`** - Styles personnalisés
3. **`src/services/apiServices.js`** - Services API mis à jour

### Fichiers Backend:
1. **`backend/routes/routes.go`** - Routes ajoutées pour provinces par pays
2. **`backend/controller/area/areaController.go`** - Fonction modifiée pour supporter query parameters

### Dépendances Ajoutées:
- **`uuid`** - Pour la génération d'identifiants uniques

## Utilisation

### Pour Accéder à la Page:
1. Démarrer le backend: `cd backend && go run main.go`
2. Démarrer le frontend: `npm start`
3. Naviguer vers la page "User" dans l'application

### Pour Créer un Utilisateur:
1. Cliquer sur le bouton "Ajouter Utilisateur"
2. Remplir tous les champs requis
3. Sélectionner le pays, puis la province, puis la Area (dans cet ordre)
4. Optionnellement ajouter une image de profil et signature
5. Cliquer sur "Créer Utilisateur"

## Messages de Notification

### Succès:
- "Utilisateur créé avec succès!"

### Erreurs:
- "Veuillez corriger les erreurs dans le formulaire"
- "Erreur lors de la création de l'utilisateur: [détails]"
- "Erreur lors de la récupération des [pays/provinces/Areas]"

## Notes Techniques

### Validation:
- Tous les champs requis sont validés côté client
- Les mots de passe doivent correspondre
- L'email doit avoir un format valide
- Les dropdowns hiérarchiques (pays > province > Area) sont interdépendants

### Sécurité:
- Les mots de passe sont hashés côté backend avant stockage
- Validation des données côté backend également
- Authentification requise pour toutes les opérations

### Performance:
- Chargement paresseux des provinces et Areas
- Mise en cache des données des pays
- Pagination pour la liste des utilisateurs

## Améliorations Futures Possibles

1. **Upload d'Images**: Implémenter le stockage réel des images de profil
2. **Édition d'Utilisateurs**: Ajouter la fonctionnalité de modification
3. **Suppression d'Utilisateurs**: Ajouter la confirmation de suppression
4. **Recherche et Filtrage**: Ajouter des options de recherche avancée
5. **Export de Données**: Permettre l'export de la liste des utilisateurs
6. **Permissions Granulaires**: Implémenter un système de permissions plus détaillé

## Configuration Backend Requise

Assurez-vous que les tables suivantes existent dans votre base de données:
- `users` - Table principale des utilisateurs
- `countries` - Table des pays
- `provinces` - Table des provinces (liée aux pays)
- `areas` - Table des Areas (liée aux provinces)

Les relations foreign key doivent être correctement configurées entre ces tables.
