# Stock Management System

Système de gestion de stock permettant de suivre l'inventaire, les clients et les commandes.

## Fonctionnalités

- Dashboard avec vue d'ensemble de l'activité
- Gestion des stocks (niveaux, statuts, catégories)
- Gestion des clients et de leur historique de commandes
- Suivi des commandes de la création à la livraison
- Espace admin sécurisé
- Interface moderne avec mode sombre/clair

## Stack technique

**Frontend**
- React 19 + Vite, TypeScript
- Chakra UI + CSS Modules
- React Router DOM

**Backend**
- NestJS (Node.js)
- PostgreSQL 15
- TypeORM

**DevOps**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- pnpm

## Installation

Prérequis : Docker & Docker Compose, ou Node.js v20+ et pnpm en local.

```bash
git clone https://github.com/M4STERPIECE77K/stock-management.git
cd stock-management
```

Le fichier `.env` est déjà configuré par défaut. À adapter en production.

**Avec Docker (recommandé)**
```bash
docker-compose up -d --build
```

**Frontend en local**
```bash
cd frontend
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

## Base de données

- **Products** : produits, prix, catégories, statut du stock
- **Customers** : informations clients
- **Orders** : cycle de vie des commandes
- **Order Items** : détail des articles commandés
- **Admin Users** : accès administrateur

## Contribution

1. Branche principale : `develop`
2. Créer une branche `feature/nom-de-la-feature` depuis `develop`
3. Ouvrir une PR vers `develop` (tests et lint automatiques via CI)

## Licence

MIT - voir le fichier LICENSE.