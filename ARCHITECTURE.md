# Architecture du Projet — Stock Management System

## Table des Matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack Technique](#2-stack-technique)
3. [Architecture Backend](#3-architecture-backend)
4. [Architecture Frontend](#4-architecture-frontend)
5. [Structure du Projet](#5-structure-du-projet)
6. [Code Source Complet](#6-code-source-complet)

---

## 1. Vue d'ensemble

Système de gestion de stock permettant de suivre l'inventaire, les clients et les commandes.
L'application suit une architecture **monolithique** avec un frontend React et un backend NestJS,
le tout orchestré via Docker Compose avec une base PostgreSQL.

### Flux principal

```
Client (Browser) → Frontend (React/Vite) → API Backend (NestJS) → PostgreSQL
                          │                        │
                    Docker (nginx:alpine)      Docker (Node 22)
```

---

## 2. Stack Technique

### Frontend
- **React 19** + **Vite 7** (build tool)
- **Chakra UI v3** (système de design)
- **TypeScript** / **JavaScript (JSX)**
- **React Router DOM v7** (routing)
- **Framer Motion** (animations)
- **i18next** (internationalisation : EN, FR, MG)
- **react-icons** + **Material Symbols** (icônes)
- **xlsx** (import Excel)

### Backend
- **NestJS 11** (framework Node.js)
- **TypeORM** (ORM PostgreSQL)
- **PostgreSQL 15** (base de données)
- **Passport.js** (authentification JWT + Refresh Token)
- **bcrypt** (hashing des mots de passe)
- **Nodemailer** + **Handlebars** (emails)
- **Swagger** (documentation API)
- **class-validator** / **class-transformer** (validation DTO)
- **@nestjs/throttler** (rate limiting)
- **@nestjs/terminus** (health check)

### DevOps
- **Docker** & **Docker Compose** (conteneurisation)
- **GitHub Actions** (CI/CD)
- **pnpm** (gestionnaire de paquets)
- **Nginx** (serveur statique frontend en production)

---

## 3. Architecture Backend

### Structure NestJS

```
backend/
├── src/
│   ├── main.ts                    # Point d'entrée, configuration globale
│   ├── app.module.ts              # Module racine
│   ├── app.controller.ts          # Contrôleur racine (GET /)
│   ├── app.service.ts             # Service racine
│   ├── core/                      # Modules transverses (global)
│   │   ├── core.module.ts         # Configuration, DB, Mailer
│   │   ├── config/configuration.ts # Variables d'environnement
│   │   ├── config/throttler.config.ts # Configuration rate limiting
│   │   ├── database/database.module.ts # TypeORM async config
│   │   └── filters/all-exceptions.filter.ts # Filtre d'exception global
│   └── modules/                   # Modules fonctionnels
│       ├── auth/                  # Authentification JWT + Refresh Token
│       ├── users/                 # Gestion des utilisateurs admin
│       ├── customers/             # Gestion des clients
│       ├── orders/                # Gestion des commandes
│       ├── dashboard/             # Tableau de bord agrégé
│       ├── health/                # Health check PostgreSQL
│       ├── products/              # Gestion des produits
│       ├── categories/            # Gestion des catégories
│       └── stock/                 # Mouvements de stock
├── migrations/                    # Scripts SQL initiaux
├── templates/                     # Templates Handlebars (emails)
└── test/                          # Tests e2e
```

### Modules détaillés

#### CoreModule (global)
- **ConfigModule** : charge `.env`, expose `ConfigService`
- **MailerModule** : configuration Nodemailer + Handlebars
- **DatabaseModule** : TypeORM async avec PostgreSQL

#### AuthModule
- **Stratégies** : LocalStrategy (email/password), JwtStrategy (bearer token, 1h), RefreshTokenStrategy (refresh token, 7j)
- **Guards** : `LocalAuthGuard`, `JwtAuthGuard`, `JwtRefreshGuard`, `RolesGuard` (global)
- **Rate Limiting** : `/login` et `/forgot-password` limités à 5 req/5 min via `@Throttle()`
- **Endpoints** :
  - `POST /api/v1/auth/login` → connexion, retourne `{ access_token, refresh_token }`
  - `POST /api/v1/auth/logout` → déconnexion
  - `GET /api/v1/auth/profile` → profil utilisateur
  - `POST /api/v1/auth/update-profile` → mise à jour profil
  - `POST /api/v1/auth/forgot-password` → email de reset (throttled)
  - `POST /api/v1/auth/reset-password` → réinitialisation mot de passe
  - `POST /api/v1/auth/upload-avatar` → upload photo (validé: JPEG/PNG/WebP, max 2Mo)
  - `POST /api/v1/auth/refresh` → rafraîchir l'access token

#### UsersModule
- **Entité** : `User` (table `admin_users`)
- **Service** : CRUD utilisateurs, seed admin au démarrage (`onModuleInit`)

#### CategoriesModule
- **Entité** : `Category` avec `CategoryStatus` (ACTIVE / INACTIVE)
- **Repository** : `CategoryRepository` avec filtres (search, status, pagination)
- **Endpoints** :
  - `GET /api/v1/categories` → liste filtrée
  - `GET /api/v1/categories/:id` → détail
  - `POST /api/v1/categories` → création
  - `PATCH /api/v1/categories/:id` → modification
  - `DELETE /api/v1/categories/:id` → suppression

#### ProductsModule
- **Entité** : `Product` avec statut calculé (EN_STOCK, FAIBLE, CRITIQUE, RUPTURE)
- **Repository** : `ProductRepository` avec filtres avancés
- **Cache Service** : cache en mémoire (`Map`) des résultats de requêtes
- **Endpoints** :
  - `GET /api/v1/products` → liste filtrée et paginée
  - `GET /api/v1/products/stats` → statistiques globales
  - `GET /api/v1/products/:id` → détail
  - `POST /api/v1/products` → création
  - `POST /api/v1/products/bulk` → import en masse
  - `PATCH /api/v1/products/:id` → modification
  - `DELETE /api/v1/products/:id` → suppression

#### StockModule
- **Entité** : `StockMovement` avec type (ENTRY / EXIT / ADJUSTMENT)
- **Transactions** : utilisation de `QueryRunner` pour atomicité
- **Contre-mouvement** : possibilité d'annuler un mouvement en créant un mouvement inverse (audit trail conservé)
- **Endpoints** :
  - `GET /api/v1/stock/movements` → historique des mouvements
  - `POST /api/v1/stock/movements` → nouveau mouvement
  - `POST /api/v1/stock/movements/:id/reverse` → contre-mouvement (inverse le type)
    - ENTRY → EXIT, EXIT → ENTRY, ADJUSTMENT → ADJUSTMENT
    - Raison personnalisable via body optionnel

#### CustomersModule
- **Entité** : `Customer` avec statut ACTIVE / INACTIVE, contrainte email OU phone obligatoire
- **Repository** : `CustomerRepository` avec filtres (search, status, pagination)
- **Endpoints** :
  - `GET /api/v1/customers` → liste filtrée
  - `GET /api/v1/customers/:id` → détail
  - `POST /api/v1/customers` → création (email ou phone requis)
  - `PATCH /api/v1/customers/:id` → modification
  - `DELETE /api/v1/customers/:id` → suppression

#### OrdersModule
- **Entités** : `Order` (status: EN_ATTENTE, EXPEDIEE, LIVREE, ANNULEE), `OrderItem`
- **Transactions** : création transactionnelle en `QueryRunner` avec décrément de stock
- **Règles métier** :
  - Vérification du stock disponible avant création
  - Décrémentation automatique du stock + mouvement `EXIT`
  - Incrémentation du compteur de commandes client
  - Changement de statut avec validation (pas de retour depuis LIVREE/ANNULEE)
  - Annulation = réinjection du stock + mouvement `ENTRY`
- **Endpoints** :
  - `GET /api/v1/orders` → liste filtrée (status, client, pagination)
  - `GET /api/v1/orders/:id` → détail avec lignes
  - `POST /api/v1/orders` → création
  - `PATCH /api/v1/orders/:id/status` → changement de statut

#### DashboardModule
- **Service** : agrège les données en temps réel
- **Endpoints** :
  - `GET /api/v1/dashboard/summary` → chiffre d'affaires (current/previous), commandes par statut, valeur du stock, alertes stock, commandes récentes

#### HealthModule
- **Endpoints** :
  - `GET /api/v1/health` → health check avec vérification PostgreSQL (via `@nestjs/terminus`)
- **Docker** : HEALTHCHECK configuré dans le Dockerfile et docker-compose.yml

### Base de données

Tables principales :
- `admin_users` — utilisateurs administrateurs
- `categories` — catégories de produits
- `products` — produits avec référence unique
- `stock_movements` — mouvements de stock (audit trail)
- `customers` — clients
- `orders` — commandes
- `order_items` — lignes de commande

### Configuration (variables d'environnement)

| Variable | Défaut | Description |
|---|---|---|
| `PORT` | 3005 | Port du serveur |
| `DB_HOST` | localhost | Hôte PostgreSQL |
| `DB_PORT` | 5432 | Port PostgreSQL |
| `DB_USER` | postgres | Utilisateur DB |
| `DB_PASSWORD` | (vide) | Mot de passe DB |
| `DB_NAME` | postgres | Nom de la DB |
| `JWT_SECRET` | secretKey | Secret JWT |
| `ADMIN_EMAIL` | — | Email admin (seed) |
| `ADMIN_PASSWORD` | — | Mot de passe admin (seed) |
| `MAIL_HOST` | — | Serveur SMTP |
| `MAIL_USER` | — | Utilisateur SMTP |
| `MAIL_PASSWORD` | — | Mot de passe SMTP |
| `MAIL_FROM` | — | Expéditeur emails |
| `REFRESH_TOKEN_SECRET` | refreshSecretKey | Secret pour refresh token JWT |
| `THROTTLE_TTL` | 60000 | Fenêtre de throttling (ms) |
| `THROTTLE_LIMIT` | 60 | Requêtes max par fenêtre |

---

## 4. Architecture Frontend

### Structure React

```
frontend/
├── src/
│   ├── main.jsx                       # Point d'entrée React
│   ├── App.jsx                        # Routes & layout principal
│   ├── i18n.js                        # Configuration i18n (EN/FR/MG)
│   ├── theme/system.js                # Thème Chakra UI personnalisé
│   ├── index.css                      # Styles globaux
│   ├── vite-env.d.ts                  # Types Vite
│   ├── utils/
│   │   └── fetchWithRefresh.ts        # HTTP client avec refresh token automatique
│   ├── hooks/
│   │   └── useAppToast.js             # Hook toast Chakra UI v3 (createToaster)
│   ├── providers/
│   │   └── QueryProvider.jsx          # Provider TanStack Query (React Query)
│   ├── components/
│   │   ├── navigation/
│   │   │   ├── sidebar.tsx            # Barre latérale (layout protégé)
│   │   │   └── headerbar.tsx          # Barre d'en-tête (pages publiques)
│   │   ├── ui/
│   │   │   ├── color-mode.jsx         # Mock du mode clair/sombre
│   │   │   └── Snackbar.tsx            # Ancien composant toast (remplacé par useAppToast)
│   │   ├── ProtectedRoute.jsx         # Garde d'authentification
│   │   └── PageTransition.jsx         # Animation de transition
│   └── pages/
│       ├── Auth/
│       │   ├── LoginForm.tsx          # Page de connexion
│       │   ├── ForgotPassword.tsx     # Mot de passe oublié
│       │   ├── LinkVerification.tsx   # Vérification email
│       │   └── ResetPassword.tsx      # Réinitialisation mot de passe
│       ├── Dashboard/Dashboard.tsx    # Tableau de bord principal
│       ├── Products/
│       │   ├── Products.tsx           # Gestion des produits (tabs)
│       │   ├── ProductsListTabContent.tsx # Liste des produits
│       │   ├── CategoryListTabContent.tsx # Liste des catégories
│       │   └── modal/
│       │       ├── AddProductModal.tsx    # Modal ajout produit
│       │       ├── EditProductModal.tsx   # Modal édition produit
│       │       ├── AddCategoryModal.tsx   # Modal ajout catégorie
│       │       └── ImportProductsModal.tsx # Modal import Excel
│       ├── Stock/Stock.tsx           # Gestion des stocks
│       ├── Orders/Orders.tsx         # Commandes (placeholder)
│       ├── Customers/Customers.tsx   # Clients (placeholder)
│       └── Users/UsersProfile.tsx    # Profil administrateur
```

### Routage

```
/login                  → LoginForm (public)
/forgot-password        → ForgotPassword (public)
/link-verification      → LinkVerification (public)
/reset-password         → ResetPassword (public)
/dashboard              → Dashboard (protégé)
/stock                  → Stock (protégé)
/products               → Products (protégé)
/orders                 → Orders (protégé)
/customers              → Customers (protégé)
/profile                → UsersProfile (protégé)
/                       → Redirection vers /dashboard (protégé)
*                       → Redirection vers /login
```

### Internationalisation

Trois langues supportées via i18next :
- **EN** — Anglais
- **FR** — Français
- **MG** — Malgache

---

## 5. Structure du Projet

```
stock-management/
├── .github/
│   └── workflows/
│       ├── ci-develop.yml        # CI push develop/main (lint + build + test)
│       ├── ci-feature.yml        # CI push feature/bugfix/infra (lint + build)
│       └── docker-publish.yml    # Build & push images GHCR sur main/tag v*
├── backend/
│   ├── migrations/
│   │   ├── v1_schema.sql       # UUID & enums initiaux
│   │   ├── v2_table.sql        # Tables principales
│   │   └── v3_stock_movements.sql  # Table stock_movements
│   ├── templates/
│   │   └── forgot-password.hbs # Template email reset password
│   ├── test/
│   │   ├── app.e2e-spec.ts     # Test e2e de base
│   │   └── jest-e2e.json       # Config Jest e2e
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   ├── app.controller.spec.ts
│   │   ├── app.service.ts
│   │   ├── core/
│   │   │   ├── core.module.ts
│   │   │   ├── config/configuration.ts
│   │   │   ├── config/throttler.config.ts
│   │   │   ├── database/database.module.ts
│   │   │   └── filters/all-exceptions.filter.ts
│   │   └── modules/
│   │       ├── auth/
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── dto/login.dto.ts
│   │       │   ├── dto/reset-password.dto.ts
│   │       │   ├── decorators/roles.decorator.ts
│   │       │   ├── guards/jwt-auth.guard.ts
│   │       │   ├── guards/jwt-refresh.guard.ts
│   │       │   ├── guards/local-auth.guard.ts
│   │       │   ├── guards/roles.guard.ts
│   │       │   ├── strategies/jwt.strategy.ts
│   │       │   ├── strategies/local.strategy.ts
│   │       │   └── strategies/refresh-token.strategy.ts
│   │       ├── customers/
│   │       │   ├── customers.module.ts
│   │       │   ├── customers.controller.ts
│   │       │   ├── customers.service.ts
│   │       │   ├── dto/create-customer.dto.ts
│   │       │   ├── dto/update-customer.dto.ts
│   │       │   ├── dto/customer-filter.dto.ts
│   │       │   ├── entities/customer.entity.ts
│   │       │   └── repositories/customer.repository.ts
│   │       ├── orders/
│   │       │   ├── orders.module.ts
│   │       │   ├── orders.controller.ts
│   │       │   ├── orders.service.ts
│   │       │   ├── dto/create-order.dto.ts
│   │       │   ├── dto/order-filter.dto.ts
│   │       │   ├── dto/update-order-status.dto.ts
│   │       │   ├── entities/order.entity.ts
│   │       │   ├── entities/order-item.entity.ts
│   │       │   └── repositories/order.repository.ts
│   │       ├── dashboard/
│   │       │   ├── dashboard.module.ts
│   │       │   ├── dashboard.controller.ts
│   │       │   └── dashboard.service.ts
│   │       ├── health/
│   │       │   ├── health.module.ts
│   │       │   └── health.controller.ts
│   │       ├── users/
│   │       │   ├── users.module.ts
│   │       │   ├── users.controller.ts
│   │       │   ├── users.service.ts
│   │       │   └── entities/user.entity.ts
│   │       ├── categories/
│   │       │   ├── categories.module.ts
│   │       │   ├── categories.controller.ts
│   │       │   ├── categories.service.ts
│   │       │   ├── dto/create-category.dto.ts
│   │       │   ├── dto/update-category.dto.ts
│   │       │   ├── dto/category-filter.dto.ts
│   │       │   ├── entities/category.entity.ts
│   │       │   └── repositories/category.repository.ts
│   │       ├── products/
│   │       │   ├── products.module.ts
│   │       │   ├── products.controller.ts
│   │       │   ├── products.service.ts
│   │       │   ├── products.service.spec.ts   # Tests unitaires
│   │       │   ├── dto/create-product.dto.ts
│   │       │   ├── dto/update-product.dto.ts
│   │       │   ├── dto/product-filter.dto.ts
│   │       │   ├── dto/bulk-create-product.dto.ts
│   │       │   ├── entities/product.entity.ts
│   │       │   ├── repositories/product.repository.ts
│   │       │   └── services/product-cache.service.ts
│   │       └── stock/
│   │           ├── stock.module.ts
│   │           ├── stock.controller.ts
│   │           ├── stock.service.ts
│   │           ├── stock.service.spec.ts      # Tests unitaires
│   │           ├── dto/create-stock-movement.dto.ts
│   │           ├── dto/reverse-stock-movement.dto.ts
│   │           └── entities/stock-movement.entity.ts
│   ├── Dockerfile
│   ├── docker-compose.yml     # → Racine du projet
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── pnpm-workspace.yaml
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── eslint.config.mjs
│   └── .prettierrc
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── i18n.js
│   │   ├── hooks/
│   │   │   └── useAppToast.js
│   │   ├── providers/
│   │   │   └── QueryProvider.jsx
│   │   ├── components/
│   │   │   ├── navigation/
│   │   │   │   ├── headerbar.tsx
│   │   │   │   └── sidebar.tsx
│   │   │   ├── PageTransition.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ui/
│   │   │       ├── color-mode.jsx
│   │   │       └── Snackbar.tsx
│   │   ├── pages/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── ForgotPassword.tsx
│   │   │   │   ├── LinkVerification.tsx
│   │   │   │   └── ResetPassword.tsx
│   │   │   ├── Dashboard/Dashboard.tsx
│   │   │   ├── Products/
│   │   │   │   ├── Products.tsx
│   │   │   │   ├── ProductsListTabContent.tsx
│   │   │   │   ├── CategoryListTabContent.tsx
│   │   │   │   └── modal/
│   │   │   │       ├── AddProductModal.tsx
│   │   │   │       ├── EditProductModal.tsx
│   │   │   │       ├── AddCategoryModal.tsx
│   │   │   │       └── ImportProductsModal.tsx
│   │   │   ├── Stock/Stock.tsx
│   │   │   ├── Orders/Orders.tsx
│   │   │   ├── Customers/Customers.tsx
│   │   │   └── Users/UsersProfile.tsx
│   │   └── theme/system.js
│   ├── index.html
│   ├── vite.config.js
│   ├── Dockerfile
│   ├── package.json
│   ├── eslint.config.js
│   └── pnpm-workspace.yaml
├── infra/
│   ├── docker-compose.yml      # Orquestration locale (db + backend + frontend)
│   ├── README.md               # Documentation infra
│   ├── k8s/
│   │   ├── .gitignore          # Exclut 02-secret.yaml
│   │   ├── 00-namespace.yaml
│   │   ├── 01-configmap.yaml
│   │   ├── 02-secret.example.yaml
│   │   ├── 03-postgres.yaml
│   │   ├── 04-backend.yaml
│   │   ├── 05-frontend.yaml
│   │   ├── 06-ingress.yaml
│   │   └── kustomization.yaml
│   ├── helm/stock-management/
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   │       ├── _helpers.tpl
│   │       ├── configmap.yaml
│   │       ├── secret.yaml
│   │       ├── backend.yaml
│   │       ├── frontend.yaml
│   │       ├── postgres.yaml
│   │       └── ingress.yaml
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── providers.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── terraform.tfvars.example
│   │   └── cloud-init.yaml
│   └── argocd/
│       ├── application.yaml
│       └── applicationset.yaml
├── .gitignore
├── ARCHITECTURE.md
└── README.md
```

---

## 6. Code Source Complet

---

### 6.1 — docker-compose.yml → infra/docker-compose.yml

Le fichier `docker-compose.yml` a été déplacé vers `infra/docker-compose.yml` (voir §6.6). Le chemin d'accès a changé ainsi que les contextes de build :

| Ancien (racine) | Nouveau (infra/) |
|---|---|
| `build: ./backend` | `build: ../backend` |
| `build: ./frontend` | `build: ../frontend` |
| `env_file: .env` | `env_file: ../.env` |

---

### 6.2 — .gitignore (Racine)

```gitignore
.env
.env.*
node_modules/
.DS_Store
Thumbs.db
.vscode/
.idea/
*.swp
*.swo
/dist
/build
```

---

### 6.3 — README.md (Racine)

```markdown
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
pnpm install
pnpm dev
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
```

---

### 6.4 — Backend

#### 6.4.3 — backend/tsconfig.build.json

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

---

#### 6.4.4 — backend/nest-cli.json

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

---

#### 6.4.5 — backend/.prettierrc

```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

---

#### 6.4.6 — backend/eslint.config.mjs

```javascript
// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
);
```

---

#### 6.4.7 — backend/Dockerfile

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable \
 && corepack prepare pnpm@10.14.0 --activate

COPY package.json pnpm-lock.yaml nest-cli.json tsconfig.json tsconfig.build.json ./

RUN pnpm install --frozen-lockfile

COPY src ./src
COPY templates ./templates

RUN pnpm run build

FROM node:22-alpine

WORKDIR /app

RUN corepack enable \
 && corepack prepare pnpm@10.14.0 --activate

COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/templates ./templates

EXPOSE 3000

CMD ["node", "dist/main"]
```

---

#### 6.4.8 — backend/.dockerignore

```
node_modules
dist
.git
.env
```

---

#### 6.4.9 — backend/pnpm-workspace.yaml

```yaml
allowBuilds:
  "@nestjs/core": true
  "@scarf/scarf": false
  bcrypt: true
  unrs-resolver: true
```

---

#### 6.4.10 — backend/src/main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpAdapterHost } from '@nestjs/core';
import { join } from 'path';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true });

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  //API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix('api');

  //Swagger Config
  const config = new DocumentBuilder()
    .setTitle('Stock Management API')
    .setDescription('The Stock Management API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc/api', app, document);

  await app.listen(configService.get<number>('port') || 3005);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(
    `Swagger documentation is available at: ${await app.getUrl()}/doc/api`,
  );
}
void bootstrap();
```

---

#### 6.4.11 — backend/src/app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { StockModule } from './modules/stock/stock.module';

@Module({
  imports: [
    CoreModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    StockModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

#### 6.4.12 — backend/src/app.controller.ts

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

---

#### 6.4.13 — backend/src/app.controller.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
```

---

#### 6.4.14 — backend/src/app.service.ts

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

---

#### 6.4.15 — backend/src/core/core.module.ts

```typescript
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import configuration from './config/configuration';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
      load: [configuration],
    }),
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('mail.host'),
          secure: false,
          auth: {
            user: configService.get('mail.user'),
            pass: configService.get('mail.password'),
          },
        },
        defaults: {
          from: configService.get('mail.from'),
        },
        template: {
          dir: join(process.cwd(), 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
  ],
  exports: [DatabaseModule, MailerModule],
})
export class CoreModule {}
```

---

#### 6.4.16 — backend/src/core/config/configuration.ts

```typescript
export default () => ({
  port: parseInt(process.env.PORT || '3005', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'postgres',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secretKey',
    expiresIn: '1d',
  },
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
  mail: {
    host: process.env.MAIL_HOST,
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM,
  },
});
```

---

#### 6.4.17 — backend/src/core/database/database.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rawPassword = configService.get<unknown>('database.password');
        const password = typeof rawPassword === 'string' ? rawPassword : '';

        return {
          type: 'postgres',
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password,
          database: configService.get<string>('database.name'),
          entities: [
            __dirname + '/../../modules/**/entities/*.entity{.ts,.js}',
          ],
          synchronize: true,
          autoLoadEntities: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
```

---

#### 6.4.18 — Module Auth

**auth.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RefreshTokenStrategy,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

**auth.controller.ts**
```typescript
import {
  Controller,
  Request,
  Post,
  UseGuards,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Return JWT access token' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBody({ type: LoginDto })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  logout() {
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Return user profile' })
  async getProfile(
    @Request() req: ExpressRequest & { user: { userId: string } },
  ) {
    const userId = req.user.userId;
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated and new token returned' })
  async updateProfile(
    @Request() req: ExpressRequest & { user: { userId: string } },
    @Body() body: any,
  ) {
    return this.authService.updateProfile(req.user.userId, body);
  }

  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Email sent if user exists' })
  @ApiBody({
    schema: { type: 'object', properties: { email: { type: 'string' } } },
  })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only JPEG, PNG and WebP images are allowed'), false);
        }
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload user profile picture' })
  @ApiResponse({ status: 200, description: 'Profile picture uploaded' })
  async uploadAvatar(
    @Request() req: ExpressRequest & { user: { userId: string } },
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded or file is too large');
    }
    const baseUrl =
      req.protocol + '://' + req.get('host') + '/uploads/' + file.filename;
    return this.authService.updateProfilePicture(req.user.userId, baseUrl);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { refresh_token: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Return new JWT tokens' })
  async refresh(
    @Request()
    req: ExpressRequest & { user: { userId: string; email: string } },
  ) {
    return this.authService.refreshToken(req.user);
  }
}
```

**auth.service.ts**
```typescript
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await user.validatePassword(pass))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async login(user: any) {
    const payload = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      email: user.email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      sub: user.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      role: user.role,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      username: user.username,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      firstName: user.firstName,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      lastName: user.lastName,
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const refreshPayload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(refreshPayload, {
        secret: 'refreshSecretKey',
        expiresIn: '7d',
      }),
    };
  }

  async refreshToken(user: { userId: string; email: string }) {
    const userData = await this.usersService.findOneById(user.userId);
    if (!userData) {
      throw new Error('User not found');
    }
    return this.login(userData);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      try {
        const token = this.jwtService.sign(
          { sub: user.id, purpose: 'reset-password' },
          { expiresIn: '1h' },
        );
        await this.mailerService.sendMail({
          to: email,
          subject: 'Réinitialisation de mot de passe - StockManager',
          template: './forgot-password',
          context: {
            name: user.username,
            url: `http://localhost:5173/reset-password?token=${token}`,
          },
        });
        console.log(`[ForgotPassword] Email sent to ${email}`);
      } catch (error) {
        console.error(`[ForgotPassword] Failed to send email to ${email}`, error);
      }
    }
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(token);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (payload.purpose !== 'reset-password') {
        throw new Error('Invalid token purpose');
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const userId = payload.sub;
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await this.usersService.updatePassword(userId, hashedPassword);
      return { message: 'Password successfully reset' };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
      const _ = error;
      throw new Error('Invalid or expired token');
    }
  }

  async updateProfilePicture(userId: string, profilePicture: string) {
    await this.usersService.updateProfilePicture(userId, profilePicture);
    const user = await this.usersService.findOneById(userId);
    return this.login(user);
  }

  async updateProfile(userId: string, updateData: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (updateData.password) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete updateData.password;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await this.usersService.updateUser(userId, updateData);
    const user = await this.usersService.findOneById(userId);
    return this.login(user);
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }
}
```

**dto/login.dto.ts**
```typescript
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'The email of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'The password of the user' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
```

**dto/reset-password.dto.ts**
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The reset token received via email',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'NewStrongPassword123!',
    description: 'The new password',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
```

**guards/jwt-auth.guard.ts**
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**guards/local-auth.guard.ts**
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

**strategies/jwt.strategy.ts**
```typescript
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'secretKey',
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      username: payload.username,
      profilePicture: payload.profilePicture,
    };
  }
}
```

**strategies/local.strategy.ts**
```typescript
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, pass: string): Promise<any> {
    const user = await this.authService.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

**decorators/roles.decorator.ts**
```typescript
import { SetMetadata } from '@nestjs/common';

export enum Role {
  ADMIN = 'ADMIN',
  VENDEUR = 'VENDEUR',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

**guards/roles.guard.ts**
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{
      user: { role: Role };
    }>();

    return requiredRoles.some((role) => user.role === role);
  }
}
```

**guards/jwt-refresh.guard.ts**
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
```

**strategies/refresh-token.strategy.ts**
```typescript
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      secretOrKey:
        configService.get<string>('jwt.refreshSecret') || 'refreshSecretKey',
      passReqToCallback: false,
    });
  }

  validate(payload: { sub: string; email: string }) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

---

#### 6.4.19 — Module Users

**users.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
```

**users.controller.ts**
```typescript
import { Controller } from '@nestjs/common';

@Controller('users')
export class UsersController {}
```

**users.service.ts**
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.usersRepository.update(id, { passwordHash });
  }

  async updateProfilePicture(id: string, profilePicture: string): Promise<void> {
    await this.usersRepository.update(id, { profilePicture });
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<void> {
    await this.usersRepository.update(id, updateData);
  }

  private async seedAdminUser() {
    const adminEmail = this.configService.get<string>('admin.email');
    const adminPassword = this.configService.get<string>('admin.password');

    if (!adminEmail || !adminPassword) {
      console.warn('Admin credentials not found in configuration. Skipping seeding.');
      return;
    }

    const existingAdmin = await this.findOneByEmail(adminEmail);

    if (!existingAdmin) {
      const admin = this.usersRepository.create({
        username: 'MASTERPIECE',
        email: adminEmail,
        passwordHash: adminPassword,
        role: 'ADMIN',
      });
      await this.usersRepository.save(admin);
      console.log('Admin user seeded successfully.');
    }
  }
}
```

**entities/user.entity.ts**
```typescript
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn, BeforeInsert,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('admin_users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ default: 'ADMIN' })
  role: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column({ name: 'profile_picture', nullable: true, type: 'text' })
  profilePicture: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.passwordHash) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }
}
```

---

#### 6.4.20 — Module Categories

**categories.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { CategoryRepository } from './repositories/category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoryRepository],
  exports: [CategoriesService],
})
export class CategoriesModule {}
```

**categories.controller.ts**
```typescript
import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryFilterDto } from './dto/category-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll(@Query() filter: CategoryFilterDto) {
    return this.categoriesService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
```

**categories.service.ts**
```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CategoryRepository } from './repositories/category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryFilterDto } from './dto/category-filter.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async findAll(filter: CategoryFilterDto) {
    return this.categoryRepository.findAll(filter);
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findByName(name: string) {
    return this.categoryRepository.findByName(name);
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const existing = await this.categoryRepository.findByName(createCategoryDto.name);
    if (existing) {
      throw new ConflictException(`Category with name ${createCategoryDto.name} already exists`);
    }
    return this.categoryRepository.create(createCategoryDto);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.categoryRepository.findByName(updateCategoryDto.name);
      if (existing) {
        throw new ConflictException(`Category with name ${updateCategoryDto.name} already exists`);
      }
    }
    return this.categoryRepository.update(id, updateCategoryDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.categoryRepository.delete(id);
  }

  async incrementProductCount(id: string) {
    return this.categoryRepository.incrementProductCount(id);
  }

  async decrementProductCount(id: string) {
    return this.categoryRepository.decrementProductCount(id);
  }
}
```

**dto/create-category.dto.ts**
```typescript
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { CategoryStatus } from '../entities/category.entity';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus;
}
```

**dto/update-category.dto.ts**
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
```

**dto/category-filter.dto.ts**
```typescript
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CategoryStatus } from '../entities/category.entity';

export class CategoryFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
```

**entities/category.entity.ts**
```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

export enum CategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: CategoryStatus, default: CategoryStatus.ACTIVE })
  status: CategoryStatus;

  @Column({ default: 0 })
  productCount: number;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**repositories/category.repository.ts**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryFilterDto } from '../dto/category-filter.dto';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  async findAll(filter: CategoryFilterDto): Promise<{ items: any[]; total: number }> {
    const { search, status, page = 1, limit = 10 } = filter;
    const query = this.repository
      .createQueryBuilder('category')
      .select([
        'category.id', 'category.name', 'category.description',
        'category.status', 'category.productCount', 'category.createdAt',
      ]);

    if (search) {
      query.andWhere(
        '(category.name ILIKE :search OR category.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (status) {
      query.andWhere('category.status = :status', { status });
    }

    query.offset((page - 1) * limit).limit(limit);
    query.orderBy('category.name', 'ASC');

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async findById(id: string): Promise<Category | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Category | null> {
    return this.repository.findOne({ where: { name } });
  }

  async create(category: Partial<Category>): Promise<Category> {
    const newCategory = this.repository.create(category);
    return this.repository.save(newCategory);
  }

  async update(id: string, category: Partial<Category>): Promise<Category | null> {
    await this.repository.update(id, category);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async incrementProductCount(id: string): Promise<void> {
    await this.repository.increment({ id }, 'productCount', 1);
  }

  async decrementProductCount(id: string): Promise<void> {
    await this.repository.decrement({ id }, 'productCount', 1);
  }
}
```

---

#### 6.4.21 — Module Products

**products.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductRepository } from './repositories/product.repository';
import { ProductCacheService } from './services/product-cache.service';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), CategoriesModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductRepository, ProductCacheService],
  exports: [ProductsService, ProductCacheService],
})
export class ProductsModule {}
```

**products.controller.ts**
```typescript
import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { BulkCreateProductDto } from './dto/bulk-create-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Post('bulk')
  bulkCreate(@Body() products: BulkCreateProductDto[]) {
    return this.productsService.bulkCreate(products);
  }

  @Get()
  findAll(@Query() filter: ProductFilterDto) {
    return this.productsService.findAll(filter);
  }

  @Get('stats')
  getStats() {
    return this.productsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
```

**products.service.ts**
```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ProductRepository } from './repositories/product.repository';
import { ProductCacheService } from './services/product-cache.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { BulkCreateProductDto } from './dto/bulk-create-product.dto';
import { Product } from './entities/product.entity';
import { CategoriesService } from '../categories/categories.service';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly cacheService: ProductCacheService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async findAll(filter: ProductFilterDto) {
    const cacheKey = `products_list_${JSON.stringify(filter)}`;
    const cached = this.cacheService.get<{ items: Product[]; total: number }>(cacheKey);
    if (cached) return cached;

    const result = await this.productRepository.findAll(filter);
    this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  async getStats() {
    const cacheKey = 'products_global_stats';
    const cached = this.cacheService.get<{ total: number; lowStock: number; outOfStock: number }>(cacheKey);
    if (cached) return cached;

    const stats = await this.productRepository.getStats();
    this.cacheService.set(cacheKey, stats, 300);
    return stats;
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { categoryId, ...productData } = createProductDto;

    if (!productData.reference) {
      productData.reference = await this.generateReference();
    }

    const existing = await this.productRepository.findByReference(productData.reference);
    if (existing) {
      throw new ConflictException(`Product with reference ${productData.reference} already exists`);
    }

    const category = await this.categoriesService.findOne(categoryId);

    const product = await this.productRepository.create({
      ...productData,
      category,
      stockStatus: this.calculateStockStatus(
        productData.stockQuantity || 0,
        productData.minStockThreshold || 10,
      ),
    });

    await this.categoriesService.incrementProductCount(categoryId);
    this.cacheService.clear();
    return product;
  }

  async bulkCreate(products: BulkCreateProductDto[]): Promise<{ created: number; errors: string[] }> {
    const results: { created: number; errors: string[] } = { created: 0, errors: [] };

    for (const data of products) {
      try {
        const category = await this.categoriesService.findByName(data.categoryName);
        if (!category) {
          results.errors.push(`Produit "${data.name}": Catégorie "${data.categoryName}" inexistante`);
          continue;
        }
        await this.create({
          name: data.name,
          categoryId: category.id,
          price: data.price,
          stockQuantity: data.stockQuantity,
          minStockThreshold: data.minStockThreshold,
          reference: data.reference,
        });
        results.created++;
      } catch (error) {
        results.errors.push(`Produit "${data.name}": ${(error as Error).message}`);
      }
    }

    this.cacheService.clear();
    return results;
  }

  private async generateReference(): Promise<string> {
    const lastRef = await this.productRepository.findLastReference();
    if (!lastRef) return 'REF-00001';

    const match = lastRef.match(/REF-(\d+)/);
    if (!match) return 'REF-00001';

    const nextNumber = parseInt(match[1], 10) + 1;
    return `REF-${nextNumber.toString().padStart(5, '0')}`;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const { categoryId, ...productData } = updateProductDto;

    if (productData.reference && productData.reference !== product.reference) {
      const existing = await this.productRepository.findByReference(productData.reference);
      if (existing) {
        throw new ConflictException(`Product with reference ${productData.reference} already exists`);
      }
    }

    const updateData: Partial<Product> & { category?: Category } = { ...productData };
    if (categoryId && (!product.category || categoryId !== product.category.id)) {
      if (product.category) {
        await this.categoriesService.decrementProductCount(product.category.id);
      }
      updateData.category = await this.categoriesService.findOne(categoryId);
      await this.categoriesService.incrementProductCount(categoryId);
    }

    if (productData.stockQuantity !== undefined || productData.minStockThreshold !== undefined) {
      updateData.stockStatus = this.calculateStockStatus(
        productData.stockQuantity ?? product.stockQuantity,
        productData.minStockThreshold ?? product.minStockThreshold,
      );
    }

    const updated = await this.productRepository.update(id, updateData);
    this.cacheService.clear();
    return updated!;
  }

  private calculateStockStatus(quantity: number, threshold: number): string {
    if (quantity <= 0) return 'RUPTURE';
    if (quantity <= threshold / 2) return 'CRITIQUE';
    if (quantity <= threshold) return 'FAIBLE';
    return 'EN_STOCK';
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.delete(id);
    if (product.category) {
      await this.categoriesService.decrementProductCount(product.category.id);
    }
    this.cacheService.clear();
  }
}
```

**dto/create-product.dto.ts**
```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minStockThreshold?: number;
}
```

**dto/update-product.dto.ts**
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

**dto/product-filter.dto.ts**
```typescript
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
```

**dto/bulk-create-product.dto.ts**
```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class BulkCreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  categoryName: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minStockThreshold?: number;

  @IsString()
  @IsOptional()
  reference?: string;
}
```

**entities/product.entity.ts**
```typescript
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn, ManyToOne,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column()
  name: string;

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Column({
    name: 'stock_status',
    type: 'enum',
    enum: ['CRITIQUE', 'EN_STOCK', 'RUPTURE', 'FAIBLE'],
    default: 'EN_STOCK',
  })
  stockStatus: string;

  @Column({ name: 'min_stock_threshold', default: 10 })
  minStockThreshold: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**repositories/product.repository.ts**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductFilterDto } from '../dto/product-filter.dto';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  async findAll(filter: ProductFilterDto): Promise<{ items: Product[]; total: number }> {
    const { search, category, stockStatus, page = 1, limit = 10, sortBy, sortOrder = 'DESC' } = filter;
    const query = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.reference ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (category) {
      query.andWhere('(category.id = :category OR category.name = :category)', { category });
    }
    if (stockStatus) {
      if (stockStatus === 'OUT_OF_STOCK') {
        query.andWhere('product.stockQuantity = 0');
      } else if (stockStatus === 'LOW_STOCK') {
        query.andWhere(
          'product.stockQuantity > 0 AND product.stockQuantity <= product.minStockThreshold',
        );
      } else if (stockStatus === 'IN_STOCK') {
        query.andWhere('product.stockQuantity > product.minStockThreshold');
      }
    }

    query.skip((page - 1) * limit).take(limit);

    if (sortBy) {
      const sortField = sortBy.includes('.') ? sortBy : `product.${sortBy}`;
      query.orderBy(sortField, sortOrder);
    } else {
      query.orderBy('product.createdAt', 'DESC');
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async findById(id: string): Promise<Product | null> {
    return this.repository.findOne({ where: { id }, relations: ['category'] });
  }

  async findByReference(reference: string): Promise<Product | null> {
    return this.repository.findOne({ where: { reference } });
  }

  async findLastReference(): Promise<string | null> {
    const lastProduct = await this.repository.findOne({
      where: {},
      order: { reference: 'DESC' },
    });
    return lastProduct ? lastProduct.reference : null;
  }

  async getStats(): Promise<{ total: number; lowStock: number; outOfStock: number }> {
    const [total, lowStock, outOfStock] = await Promise.all([
      this.repository.count(),
      this.repository.count({
        where: [{ stockStatus: 'FAIBLE' }, { stockStatus: 'CRITIQUE' }],
      }),
      this.repository.count({ where: { stockStatus: 'RUPTURE' } }),
    ]);
    return { total, lowStock, outOfStock };
  }

  async create(product: Partial<Product>): Promise<Product> {
    const newProduct = this.repository.create(product);
    return this.repository.save(newProduct);
  }

  async update(id: string, product: Partial<Product>): Promise<Product | null> {
    await this.repository.update(id, product);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
```

**services/product-cache.service.ts**
```typescript
import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

@Injectable()
export class ProductCacheService {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, value: T, ttl: number = 3600): void {
    this.cache.set(key, { value, expiry: Date.now() + ttl * 1000 });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    return cached.value as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}
```

---

#### 6.4.22 — Module Stock

**stock.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { StockMovement } from './entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement, Product]), ProductsModule],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
```

**stock.controller.ts**
```typescript
import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { ReverseStockMovementDto } from './dto/reverse-stock-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('stock')
@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('movements')
  @ApiOperation({ summary: 'List stock movements' })
  findAll(@Query('productId') productId?: string) {
    return this.stockService.findAll(productId);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Create a stock movement' })
  create(@Body() createStockMovementDto: CreateStockMovementDto) {
    return this.stockService.createMovement(createStockMovementDto);
  }

  @Post('movements/:id/reverse')
  @ApiOperation({ summary: 'Reverse a stock movement (creates counter-movement)' })
  reverse(
    @Param('id') id: string,
    @Body() dto: ReverseStockMovementDto,
  ) {
    return this.stockService.reverseMovement(id, dto.reason);
  }
}
```

**stock.service.ts**
```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockMovement, StockMovementType } from './entities/stock-movement.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  async findAll(productId?: string): Promise<StockMovement[]> {
    const query = this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .orderBy('movement.createdAt', 'DESC');

    if (productId) {
      query.where('movement.productId = :productId', { productId });
    }

    return query.getMany();
  }

  async createMovement(dto: CreateStockMovementDto): Promise<StockMovement> {
    const { productId, type, quantity, reason } = dto;

    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const oldQuantity = product.stockQuantity;
      let newQuantity = oldQuantity;

      if (type === StockMovementType.ENTRY) {
        newQuantity += quantity;
      } else if (type === StockMovementType.EXIT) {
        if (oldQuantity < quantity) {
          throw new BadRequestException('Insufficient stock for this exit');
        }
        newQuantity -= quantity;
      } else if (type === StockMovementType.ADJUSTMENT) {
        newQuantity = quantity;
      }

      product.stockQuantity = newQuantity;
      product.stockStatus = this.calculateStockStatus(newQuantity, product.minStockThreshold);
      await queryRunner.manager.save(Product, product);

      const movement = this.stockMovementRepository.create({
        productId,
        type,
        quantity: type === StockMovementType.ADJUSTMENT ? newQuantity - oldQuantity : quantity,
        reason,
      });

      const savedMovement = await queryRunner.manager.save(StockMovement, movement);
      await queryRunner.commitTransaction();
      return savedMovement;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private calculateStockStatus(quantity: number, threshold: number): string {
    if (quantity <= 0) return 'RUPTURE';
    if (quantity <= threshold / 2) return 'CRITIQUE';
    if (quantity <= threshold) return 'FAIBLE';
    return 'EN_STOCK';
  }
}
```

**dto/create-stock-movement.dto.ts**
```typescript
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { StockMovementType } from '../entities/stock-movement.entity';

export class CreateStockMovementDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsEnum(StockMovementType)
  @IsNotEmpty()
  type: StockMovementType;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
```

**entities/stock-movement.entity.ts**
```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

export enum StockMovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  ADJUSTMENT = 'ADJUSTMENT',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ type: 'enum', enum: StockMovementType })
  type: StockMovementType;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

---

#### 6.4.23 — Migrations

**migrations/v1_schema.sql**
```sql
-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enum for Product Stock Status
DO $$ BEGIN CREATE TYPE stock_status_enum AS ENUM ('CRITIQUE', 'EN_STOCK', 'RUPTURE', 'FAIBLE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
-- Enum for Order Status
DO $$ BEGIN CREATE TYPE order_status_enum AS ENUM ('LIVREE', 'EN_ATTENTE', 'EXPEDIEE', 'ANNULEE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
```

**migrations/v2_table.sql**
```sql
-- TABLE: CATEGORIES (Must be created before products)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: PRODUCTS (Combines PRODUIT and STOCK concepts)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    stock_status stock_status_enum DEFAULT 'EN_STOCK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_reference ON products(reference);

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    order_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_contact_info CHECK (
        (email IS NOT NULL AND email <> '')
        OR (phone IS NOT NULL AND phone <> '')
    )
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE SET NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status order_status_enum DEFAULT 'EN_ATTENTE',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'ADMIN' CHECK (role = 'ADMIN'),
    phone_number VARCHAR(50),
    profile_picture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
```

**migrations/v3_stock_movements.sql**
```sql
-- TABLE: STOCK_MOVEMENTS
CREATE TYPE stock_movement_type_enum AS ENUM ('ENTRY', 'EXIT', 'ADJUSTMENT');

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type stock_movement_type_enum NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
```

---

#### 6.4.24 — Templates

**templates/forgot-password.hbs**
```handlebars
<p>Bonjour {{name}},</p>
<p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
<p>Veuillez cliquer sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
<p><a href="{{url}}">Réinitialiser mon mot de passe</a></p>
<p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
```

---

#### 6.4.25 — Tests

**test/app.e2e-spec.ts**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
```

**test/jest-e2e.json**
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

**src/modules/products/products.service.spec.ts**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductRepository } from './repositories/product.repository';
import { ProductCacheService } from './services/product-cache.service';
import { CategoriesService } from '../categories/categories.service';
import { ConflictException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockProductRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByReference: jest.fn(),
    findLastReference: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getStats: jest.fn(),
  };

  const mockCategoriesService = {
    findOne: jest.fn(),
    incrementProductCount: jest.fn(),
    decrementProductCount: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: ProductRepository, useValue: mockProductRepository },
        { provide: CategoriesService, useValue: mockCategoriesService },
        { provide: ProductCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const dto: CreateProductDto = {
        name: 'Test Product',
        categoryId: 'cat-uuid',
        price: 99.99,
        stockQuantity: 50,
      };

      const mockCategory = { id: 'cat-uuid', name: 'Test Category' };
      const mockProduct = { id: 'prod-uuid', ...dto, reference: 'REF-00001' };

      mockCategoriesService.findOne.mockResolvedValue(mockCategory);
      mockProductRepository.findByReference.mockResolvedValue(null);
      mockProductRepository.findLastReference.mockResolvedValue(null);
      mockProductRepository.create.mockResolvedValue(mockProduct);

      const result = await service.create(dto);

      expect(result).toEqual(mockProduct);
      expect(mockCategoriesService.incrementProductCount).toHaveBeenCalledWith('cat-uuid');
      expect(mockCacheService.clear).toHaveBeenCalled();
    });

    it('should throw ConflictException if reference exists', async () => {
      const dto: CreateProductDto = {
        name: 'Test Product',
        categoryId: 'cat-uuid',
        price: 99.99,
        reference: 'REF-00001',
      };

      mockCategoriesService.findOne.mockResolvedValue({ id: 'cat-uuid' });
      mockProductRepository.findByReference.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});
```

**src/modules/stock/stock.service.spec.ts**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { StockService } from './stock.service';
import { StockMovement, StockMovementType } from './entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';
import { BadRequestException } from '@nestjs/common';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

describe('StockService', () => {
  let service: StockService;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  const mockStockMovementRepository = {
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
    create: jest.fn(),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: mockStockMovementRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  describe('createMovement', () => {
    it('should throw error for insufficient stock on EXIT', async () => {
      const dto: CreateStockMovementDto = {
        productId: 'prod-uuid',
        type: StockMovementType.EXIT,
        quantity: 100,
        reason: 'Test exit',
      };

      mockProductRepository.findOne.mockResolvedValue({
        id: 'prod-uuid',
        stockQuantity: 10,
        minStockThreshold: 5,
      });

      await expect(service.createMovement(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully create an ENTRY movement', async () => {
      const dto: CreateStockMovementDto = {
        productId: 'prod-uuid',
        type: StockMovementType.ENTRY,
        quantity: 50,
        reason: 'Restock',
      };

      const mockProduct = {
        id: 'prod-uuid',
        stockQuantity: 10,
        minStockThreshold: 5,
        stockStatus: 'FAIBLE',
      };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockQueryRunner.manager.save.mockResolvedValue({
        ...mockProduct,
        stockQuantity: 60,
      });

      await service.createMovement(dto);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
```

---

### 6.5 — Frontend

---

#### 6.5.1 — frontend/package.json

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "check": "pnpm lint",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@chakra-ui/react": "^3.30.0",
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "framer-motion": "^12.23.26",
    "i18next": "^25.7.3",
    "i18next-browser-languagedetector": "^8.2.0",
    "next-themes": "^0.4.6",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-i18next": "^16.5.0",
    "react-icons": "^5.5.0",
    "react-router-dom": "^7.11.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "next-themes": "^0.4.6",
    "vite": "^7.2.4"
  }
}
```

---

#### 6.5.2 — frontend/vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
```

---

#### 6.5.3 — frontend/index.html

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>E-Stock</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

---

#### 6.5.4 — frontend/Dockerfile

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable \
 && corepack prepare pnpm@10.14.0 --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY index.html ./
COPY vite.config.js ./
COPY src ./src

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

#### 6.5.5 — frontend/.dockerignore

```
node_modules
dist
.git
.env
```

---

#### 6.5.6 — frontend/eslint.config.js

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]|^motion$' }],
    },
  },
])
```

---

#### 6.5.7 — frontend/pnpm-workspace.yaml

```yaml
allowBuilds:
  esbuild: false
```

---

#### 6.5.8 — frontend/src/main.jsx

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { ColorModeProvider } from './components/ui/color-mode.jsx'
import { system } from './theme/system.js'
import { QueryProvider } from './providers/QueryProvider.jsx'
import './index.css'
import './i18n'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryProvider>
      <ChakraProvider value={system}>
        <ColorModeProvider>
          <App />
        </ColorModeProvider>
      </ChakraProvider>
    </QueryProvider>
  </StrictMode>,
)
```

---

#### 6.5.9 — frontend/src/index.js

```javascript
export { default as Dashboard } from './Dashboard/Dashboard';
export { default as Stock } from './Stock/Stock';
export { default as Products } from './Products/Products';
export { default as Orders } from './Orders/Orders';
export { default as Customers } from './Customers/Customers';
```

---

#### 6.5.10 — frontend/src/index.css

```css
:root {
  font-family: 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
a { font-weight: 500; color: #646cff; text-decoration: inherit; }
a:hover { color: #535bf2; }
body { margin: 0; min-width: 320px; min-height: 100vh; }
html, body, #root { height: 100%; width: 100%; }
h1 { font-size: 3.2em; line-height: 1.1; }
button:focus, button:focus-visible,
[role="button"]:focus, [role="button"]:focus-visible,
a:focus, a:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}
```

---

#### 6.5.11 — frontend/src/App.jsx

```jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard/Dashboard';
import Stock from './pages/Stock/Stock';
import Products from './pages/Products/Products';
import Orders from './pages/Orders/Orders';
import Customers from './pages/Customers/Customers';
import LoginForm from './pages/Auth/LoginForm';
import ForgotPassword from './pages/Auth/ForgotPassword';
import LinkVerification from './pages/Auth/LinkVerification';
import ResetPassword from './pages/Auth/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import UsersProfile from './pages/Users/UsersProfile';
import { ToastContainer } from './hooks/useAppToast';
import './App.css';

function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/link-verification" element={<LinkVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/profile" element={<UsersProfile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

#### 6.5.12 — frontend/src/App.css

```css
#root { width: 100%; height: 100%; margin: 0; padding: 0; }
.logo { height: 6em; padding: 1.5em; will-change: filter; transition: filter 300ms; }
.logo:hover { filter: drop-shadow(0 0 2em #646cffaa); }
.logo.react:hover { filter: drop-shadow(0 0 2em #61dafbaa); }
@keyframes logo-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo { animation: logo-spin infinite 20s linear; }
}
.card { padding: 2em; }
.read-the-docs { color: #888; }
```

---

#### 6.5.13 — frontend/src/theme/system.js

```javascript
import {
  createSystem, defaultConfig, defineConfig,
  defineSemanticTokens, defineTokens,
} from "@chakra-ui/react";

export const system = createSystem(
  defaultConfig,
  defineConfig({
    theme: {
      tokens: defineTokens({
        colors: {
          primary: { value: "#4F7C6B" },
          amber: { value: "#E8A33D" },
          sage: { value: "#4F7C6B" },
          sageDark: { value: "#3C6053" },
          ink: { value: "#151A21" },
          inkSoft: { value: "#1E252F" },
          paper: { value: "#EFF1EC" },
        },
        fonts: {
          heading: { value: "'Inter', sans-serif" },
          body: { value: "'Inter', sans-serif" },
        },
      }),
      semanticTokens: defineSemanticTokens({
        colors: {
          background: { value: { _light: "#EFF1EC", _dark: "#EFF1EC" } },
          card: { value: { _light: "#ffffff", _dark: "#ffffff" } },
          textMain: { value: { _light: "#151A21", _dark: "#151A21" } },
          textSub: { value: { _light: "#5B6675", _dark: "#5B6675" } },
          border: { value: { _light: "#D7DBE1", _dark: "#D7DBE1" } },
          inputBg: { value: { _light: "#ffffff", _dark: "#ffffff" } },
          inputBorder: { value: { _light: "#D7DBE1", _dark: "#D7DBE1" } },
        },
      }),
      recipes: {
        button: {
          base: {
            _focus: { outline: "none", boxShadow: "none" },
            _focusVisible: { outline: "none", boxShadow: "none" },
          },
        },
      },
    },
  })
);
```

---

#### 6.5.14 — frontend/src/components/ui/color-mode.jsx

```jsx
'use client'

export function ColorModeProvider(props) {
  return <>{props.children}</>
}

export function useColorMode() {
  return {
    colorMode: 'light',
    setColorMode: () => {},
    toggleColorMode: () => {},
  }
}

export function useColorModeValue(light) {
  return light
}
```

---

#### 6.5.15 — frontend/src/components/ui/Snackbar.tsx (déprécié)

> **Note :** Ce composant a été remplacé par le hook `useAppToast` (voir §6.5.27). Le fichier est conservé pour compatibilité mais n'est plus utilisé.

```tsx
import React from 'react';
import { Box, Text } from '@chakra-ui/react';

interface SnackbarProps {
    message: string;
    isError?: boolean;
}

export const SnackbarContent = ({ message, isError = false }: SnackbarProps) => {
    return (
        <Box position="fixed" bottom={8} left="50%" transform="translateX(-50%)"
             bg={isError ? "red.600" : "green.600"} color="white"
             px={6} py={3} borderRadius="lg" boxShadow="xl"
             display="flex" alignItems="center" gap={3} zIndex={9999}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                {isError ? 'error' : 'check_circle'}
            </span>
            <Text fontSize="md" fontWeight="medium">{message}</Text>
        </Box>
    );
};
```

---#### 6.5.16 — frontend/src/components/ProtectedRoute.jsx

```jsx
import { Navigate, Outlet } from 'react-router-dom';
import PageTransition from './PageTransition';

const ProtectedRoute = () => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <PageTransition>
            <Outlet />
        </PageTransition>
    );
};

export default ProtectedRoute;
```

---

#### 6.5.17 — frontend/src/components/PageTransition.jsx

```jsx
import { motion } from 'framer-motion';

const PageTransition = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
```

---

#### 6.5.18 — frontend/src/components/navigation/sidebar.tsx

```tsx
import { Box, Flex, Text, VStack, Link, Avatar, Button, Popover, Dialog, Separator } from '@chakra-ui/react';
import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const INK = '#151A21';
const PAPER = '#EFF1EC';
const AMBER = '#E8A33D';
const SAGE = '#4F7C6B';
const TEXT_MAIN = INK;
const TEXT_SUB = '#5B6675';
const BORDER_COLOR = '#D7DBE1';

const SidebarItem = ({ icon, label, active = false, href = "#" }: {
    icon: string, label: string, active?: boolean, href?: string
}) => {
    return (
        <Link asChild _hover={{ textDecoration: 'none' }} w="full" display="flex">
            <RouterLink to={href}>
                <Flex align="center" gap="3" px="3" py="2.5" rounded="lg" w="full"
                      bg={active ? 'rgba(79, 124, 107, 0.1)' : "transparent"}
                      color={active ? SAGE : TEXT_SUB}
                      _hover={{ bg: active ? 'rgba(79, 124, 107, 0.1)' : PAPER, color: active ? SAGE : SAGE }}
                      transition="all 0.2s" role="group">
                    <span className="material-symbols-outlined"
                          style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0", fontSize: '24px' }}>
                        {icon}
                    </span>
                    <Text fontSize="sm" fontWeight="500">{label}</Text>
                </Flex>
            </RouterLink>
        </Link>
    );
};

const NavigationContent = ({ children }: { children: React.ReactNode }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = React.useState<{ username: string; email: string; role: string; profilePicture?: string } | null>(null);
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    React.useEffect(() => {
        const fetchProfile = async () => {
            const token = window.localStorage.getItem('access_token') || window.sessionStorage.getItem('access_token');
            if (!token) return;
            try {
                const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';
                const response = await fetch(`${baseUrl}/api/v1/auth/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                }
            } catch { console.error("Failed to fetch profile"); }
        };
        fetchProfile();
    }, []);

    const isActive = (path: string) => location.pathname === path;
    const getPageTitle = (path: string) => {
        switch (path) {
            case '/': case '/dashboard': return t('sidebar.dashboard');
            case '/stock': return t('sidebar.stock');
            case '/customers': return t('sidebar.customers');
            case '/products': return t('sidebar.products');
            case '/orders': return t('sidebar.orders');
            case '/profile': return t('sidebar.profile');
            default: return "StockManager";
        }
    };

    const handleLogout = async () => {
        const token = window.localStorage.getItem('access_token') || window.sessionStorage.getItem('access_token');
        if (token) {
            try {
                const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';
                await fetch(`${baseUrl}/api/v1/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch { console.error("Logout request failed"); }
        }
        window.localStorage.removeItem('access_token');
        window.sessionStorage.removeItem('access_token');
        setIsLogoutDialogOpen(false);
        navigate('/login', { replace: true });
    };

    return (
        <Flex direction="column" h="100vh" overflow="hidden" bg={PAPER}>
            <Flex h="full" flex="1" overflow="hidden">
                <Box as="aside" w="64" bg="white" borderRight="1px" borderColor={BORDER_COLOR}
                     display={{ base: "none", md: "flex" }} flexDirection="column" zIndex="20">
                    {/* Logo */}
                    <Flex h="16" align="center" gap="3" px="6" borderBottom="1px" borderColor={BORDER_COLOR}>
                        <Flex w="8" h="8" rounded="md" bg={SAGE} align="center" justify="center" color="white">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>inventory_2</span>
                        </Flex>
                        <Text fontSize="lg" fontWeight="bold" letterSpacing="tight" color={TEXT_MAIN}>StockManager</Text>
                    </Flex>
                    <Separator />
                    {/* Navigation */}
                    <VStack flex="1" overflowY="auto" py="4" px="3" gap="4" align="stretch">
                        <SidebarItem icon="dashboard" label={t('sidebar.dashboard')} href="/dashboard" active={isActive('/dashboard')} />
                        <SidebarItem icon="package_2" label={t('sidebar.stock')} href="/stock" active={isActive('/stock')} />
                        <SidebarItem icon="group" label={t('sidebar.customers')} href="/customers" active={isActive('/customers')} />
                        <SidebarItem icon="sell" label={t('sidebar.products')} href="/products" active={isActive('/products')} />
                        <SidebarItem icon="shopping_cart" label={t('sidebar.orders')} href="/orders" active={isActive('/orders')} />
                        <Separator />
                        <Box mt="0" pt="4" borderTop="1px" borderColor={BORDER_COLOR}>
                            <Text px="3" fontSize="xs" fontWeight="semibold" textTransform="uppercase"
                                  letterSpacing="wider" mb="2" color={TEXT_SUB}>
                                {t('sidebar.reports')}
                            </Text>
                            <SidebarItem icon="bar_chart" label={t('sidebar.analysis')} />
                        </Box>
                    </VStack>
                    {/* User profile footer */}
                    <Box p="4" borderTop="1px" borderColor={BORDER_COLOR}>
                        <Popover.Root open={isProfileMenuOpen} onOpenChange={(e) => setIsProfileMenuOpen(e.open)}
                                      portalled={false}
                                      positioning={{ placement: 'top-start', sameWidth: true, fitViewport: true, overflowPadding: 8 }}>
                            <Popover.Trigger asChild>
                                <Flex align="center" gap="3" cursor="pointer" p="2" rounded="lg"
                                      _hover={{ bg: PAPER }} transition="all 0.2s">
                                    <Avatar.Root size="sm">
                                        <Avatar.Image src={user?.profilePicture} />
                                        <Avatar.Fallback name={user?.username || "Admin"} />
                                    </Avatar.Root>
                                    <Flex direction="column" overflow="hidden" flex="1">
                                        <Text fontSize="sm" fontWeight="medium" lineClamp={1} color={TEXT_MAIN}>{user?.username}</Text>
                                        <Text fontSize="xs" lineClamp={1} color={TEXT_SUB}>{user?.email}</Text>
                                    </Flex>
                                    <Box color={TEXT_SUB}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>expand_more</span>
                                    </Box>
                                </Flex>
                            </Popover.Trigger>
                            <Popover.Positioner>
                                <Popover.Content bg="white" borderColor={BORDER_COLOR} borderWidth="1px"
                                                  borderRadius="xl" p="2" w="full" maxW="full" shadow="lg">
                                    <VStack align="stretch" gap="1">
                                        <Button variant="ghost" justifyContent="flex-start" h="10" w="full"
                                                color={TEXT_SUB} bg="transparent" _hover={{ bg: PAPER, color: SAGE }}
                                                onClick={() => { setIsProfileMenuOpen(false); navigate('/profile'); }}>
                                            <Flex align="center" gap="2" w="full">
                                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_circle</span>
                                                <Text fontSize="sm" fontWeight="500">{t('sidebar.profile')}</Text>
                                            </Flex>
                                        </Button>
                                        <Separator />
                                        <Button variant="ghost" justifyContent="flex-start" h="10" colorPalette="red"
                                                w="full" bg="transparent" color="red.500" borderWidth="1px"
                                                borderColor="transparent"
                                                _hover={{ bg: 'red.50', borderColor: 'red.500' }}
                                                onClick={() => { setIsProfileMenuOpen(false); setIsLogoutDialogOpen(true); }}>
                                            <Flex align="center" gap="2" w="full">
                                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                                                <Text fontSize="sm" fontWeight="500">{t('sidebar.logout')}</Text>
                                            </Flex>
                                        </Button>
                                    </VStack>
                                </Popover.Content>
                            </Popover.Positioner>
                        </Popover.Root>
                    </Box>
                </Box>
                {/* Main content area */}
                <Flex flex="1" direction="column" minW="0" h="full">
                    <Box as="header" h="16" px="6" bg="white" borderBottom="1px" borderColor={BORDER_COLOR}
                         position="sticky" top="0" zIndex="10"
                         display="flex" alignItems="center" justifyContent="space-between">
                        <Flex align="center" gap="4">
                            <IconButton display={{ base: "flex", md: "none" }} aria-label="Menu"
                                        variant="ghost" size="sm" color={TEXT_MAIN} _focusVisible={{ outline: 'none' }}>
                                <span className="material-symbols-outlined">menu</span>
                            </IconButton>
                            <Text fontSize="lg" fontWeight="bold" color={TEXT_MAIN}>
                                {getPageTitle(location.pathname)}
                            </Text>
                        </Flex>
                        <Flex align="center" gap="4" />
                    </Box>
                    <Box id="main-content-area" flex="1" p="6" bg={PAPER} overflowY="auto">
                        {children}
                    </Box>
                </Flex>
            </Flex>
            {/* Logout confirmation dialog */}
            <Dialog.Root open={isLogoutDialogOpen} onOpenChange={(e) => setIsLogoutDialogOpen(e.open)}
                         placement="center" size="sm" closeOnInteractOutside={false}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content bg="white" color={TEXT_MAIN} borderColor={BORDER_COLOR}
                                     borderWidth="1px" borderRadius="2xl" p="4" shadow="2xl">
                        <Dialog.Header>
                            <Flex direction="column" align="center" gap="4" pt="4" w="full" textAlign="center">
                                <Box boxSize="14" mx="auto" rounded="full" bg="red.50" color="red.500"
                                     display="flex" alignItems="center" justifyContent="center">
                                    <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>logout</span>
                                </Box>
                                <Dialog.Title fontSize="xl" fontWeight="bold" textAlign="center" w="full" color={TEXT_MAIN}>
                                    {t('sidebar.logout_confirm')}
                                </Dialog.Title>
                            </Flex>
                        </Dialog.Header>
                        <Dialog.Body pt="2" pb="6">
                            <Text color={TEXT_SUB} textAlign="center">{t('sidebar.logout_desc')}</Text>
                        </Dialog.Body>
                        <Dialog.Footer gap="3">
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline" flex="1" h="11" bg="white" color={TEXT_MAIN}
                                        borderColor={BORDER_COLOR} _hover={{ bg: PAPER, borderColor: 'transparent' }}
                                        onClick={() => setIsLogoutDialogOpen(false)}>
                                    {t('profile.cancel')}
                                </Button>
                            </Dialog.ActionTrigger>
                            <Button colorPalette="red" flex="1" h="11" bg="red.500" color="white"
                                    borderWidth="1px" borderColor="transparent"
                                    _hover={{ bg: 'red.600', borderColor: 'transparent' }}
                                    _focusVisible={{ outline: 'none', boxShadow: 'none', borderColor: 'transparent' }}
                                    onClick={handleLogout}>
                                {t('sidebar.logout')}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>
        </Flex>
    );
};

const Sidebar = ({ children }: { children: React.ReactNode }) => {
    return <NavigationContent>{children}</NavigationContent>;
}

export default Sidebar;
```

---

#### 6.5.19 — frontend/src/components/navigation/headerbar.tsx

```tsx
import React from 'react';
import { Box, Container, Flex, Text, Button, Link } from '@chakra-ui/react';
import { useColorMode } from '../../components/ui/color-mode';
import { useNavigate, useLocation } from 'react-router-dom';

const HeaderBar = () => {
    const { colorMode } = useColorMode();
    const navigate = useNavigate();
    const location = useLocation();
    const isForgotPassword = location.pathname === '/forgot-password';
    const isLinkVerification = location.pathname === '/link-verification';
    const cardBg = "card";
    const borderColor = "border";
    const mainText = "textMain";
    const subText = "textSub";

    return (
        <Box className="header-login" as="header" w="full" borderBottom="1px" borderColor={borderColor}
             bg={cardBg} pos="sticky" top="0" zIndex="50">
            <Container maxW="1280px" px={{ base: 4, sm: 10 }} py="3">
                <Flex align="center" justify="space-between">
                    <Flex align="center" gap="4">
                        <Box w="8" h="8" color="primary">
                            <svg width="100%" height="100%" viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd"
                                      d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
                                      fillRule="evenodd"></path>
                            </svg>
                        </Box>
                        <Text fontSize="lg" fontWeight="bold" lineHeight="tight" letterSpacing="tight">GestionStock</Text>
                    </Flex>
                    {!isLinkVerification && (isForgotPassword ? (
                        <Flex align="center" gap={{ base: 4, sm: 8 }}>
                            <Flex display={{ base: "none", sm: "flex" }} gap="6">
                                <Link fontSize="sm" fontWeight="medium" color={subText} _hover={{ color: "primary" }} href="#">Aide</Link>
                                <Link fontSize="sm" fontWeight="medium" color={subText} _hover={{ color: "primary" }} href="#">Contact Support</Link>
                            </Flex>
                            <Button size="sm" bg="blue.50" color="primary"
                                    _hover={{ bg: "primary", color: "white" }}
                                    _dark={{ bg: "blue.900", color: "blue.200", _hover: { bg: "primary", color: "white" } }}
                                    borderRadius="lg" fontWeight="bold" onClick={() => navigate('/login')}>
                                Se connecter
                            </Button>
                        </Flex>
                    ) : (
                        <Flex gap="2">
                            <Button minW="84px" h="9" px="4"
                                    bg={colorMode === 'light' ? "#e7edf3" : "whiteAlpha.200"}
                                    color={mainText}
                                    _hover={{ bg: colorMode === 'light' ? "gray.200" : "whiteAlpha.300" }}
                                    fontSize="sm" fontWeight="bold" borderRadius="lg">
                                Aide
                            </Button>
                        </Flex>
                    ))}
                </Flex>
            </Container>
        </Box>
    );
};

export default HeaderBar;
```

---

#### 6.5.20 — frontend/src/pages/Auth/LoginForm.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Button, Input, Stack, Checkbox, Link, IconButton, InputGroup } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { useTranslation } from 'react-i18next';

const INK = '#151A21';
const INK_SOFT = '#1E252F';
const PAPER = '#EFF1EC';
const AMBER = '#E8A33D';
const SAGE = '#4F7C6B';
const SAGE_DARK = '#3C6053';
const TEXT_MAIN = INK;
const TEXT_SUB = '#5B6675';
const INPUT_BORDER = '#D7DBE1';

const SnackbarContent = ({ message, isError = false }: { message: string, isError?: boolean }) => (
    <Box position="fixed" bottom={8} left="50%" transform="translateX(-50%)"
         bg={isError ? '#B3431F' : SAGE} color="white" px={6} py={3} borderRadius="md"
         boxShadow="xl" display="flex" alignItems="center" gap={3} zIndex={9999}
         animation="stockmgr-fade-in 0.25s ease-out">
        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
            {isError ? 'error' : 'check_circle'}
        </span>
        <Text fontSize="sm" fontWeight="medium">{message}</Text>
    </Box>
);

const LoginFormContent = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => setErrorMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);
        try {
            const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';
            const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                setErrorMessage(response.status === 401 ? t('login.error_incorrect') : t('login.error_generic'));
                setIsSubmitting(false);
                return;
            }

            const data: { access_token?: string } = await response.json();
            if (!data?.access_token) {
                setErrorMessage(t('login.error_invalid_response'));
                setIsSubmitting(false);
                return;
            }

            const storage = rememberMe ? window.localStorage : window.sessionStorage;
            storage.setItem('access_token', data.access_token);
            setErrorMessage(null);
            setTimeout(() => navigate('/dashboard', { replace: true }), 500);
        } catch {
            setErrorMessage(t('login.error_network'));
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <style>{`/* ... keyframes ... */`}</style>
            <Flex minH="100vh" bg={PAPER}>
                {/* Left hero panel */}
                <Flex display={{ base: 'none', lg: 'flex' }} direction="column" justify="center"
                      w="42%" minW="420px" bg={INK} color="whiteAlpha.900" p="10" pos="relative" overflow="hidden">
                    {/* Animated background */}
                    <Box pos="absolute" inset="0" bg={INK} />
                    <Box pos="absolute" inset="0" opacity="0.35"
                         backgroundImage={`linear-gradient(135deg, ${AMBER}, ${SAGE_DARK}, ${SAGE}, ${INK}, ${AMBER})`}
                         backgroundSize="200% 200%"
                         style={{ animation: 'stockmgr-color-shift 8s ease-in-out infinite' }} />
                    {/* Stock tags */}
                    {/* Logo */}
                    <Flex align="center" gap="3" zIndex="1" position="absolute" top="10">
                        <Flex align="center" justify="center" w="9" h="9" borderRadius="md" bg={AMBER} color={INK}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>inventory_2</span>
                        </Flex>
                        <Text fontSize="md" fontWeight="bold" letterSpacing="tight">StockManager</Text>
                    </Flex>
                    <Box zIndex="1" maxW="360px" textAlign="center" margin="0 auto">
                        <Text fontSize="4xl" fontWeight="800" lineHeight="1.1" letterSpacing="-0.02em" mb="4">
                            {t('login.hero_title', 'Chaque référence, à sa juste place.')}
                        </Text>
                        <Text color="whiteAlpha.600" fontSize="sm" lineHeight="1.6">
                            {t('login.hero_subtitle', 'Suivez vos stocks, vos ventes et vos équipes depuis un seul endroit.')}
                        </Text>
                    </Box>
                </Flex>
                {/* Right login form */}
                <Flex flex="1" align="center" justify="center" p={{ base: 6, md: 10 }}>
                    <Box w="full" maxW="380px" bg="white" borderRadius="xl" p={{ base: 6, md: 8 }} boxShadow="lg">
                        <Text fontFamily="mono" fontSize="xs" letterSpacing="0.15em" color={AMBER} fontWeight="bold" mb="3">
                            CONNEXION
                        </Text>
                        <Text fontSize="2xl" fontWeight="800" letterSpacing="-0.02em" color={TEXT_MAIN} mb="2">
                            {t('login.title')}
                        </Text>
                        <Text color={TEXT_SUB} fontSize="sm" mb="8">{t('login.subtitle')}</Text>
                        <form onSubmit={handleSubmit}>
                            <Stack gap="5">
                                {/* Email field */}
                                <Box>
                                    <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.03em" mb="2"
                                          color={TEXT_SUB} textTransform="uppercase">
                                        {t('login.email_label')}
                                    </Text>
                                    <InputGroup w="full" startElement={
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7A8494' }}>person</span>
                                    }>
                                        <Input value={email} onChange={(e) => setEmail(e.target.value)}
                                               type="email" placeholder="adresse.email@example.com"
                                               size="lg" bg="white" color={TEXT_MAIN}
                                               border="1px solid" borderColor={INPUT_BORDER}
                                               borderRadius="md" h="11" fontSize="sm"
                                               _placeholder={{ color: '#9AA3AF' }}
                                               _focus={{ borderColor: SAGE, boxShadow: `0 0 0 1px ${SAGE}` }} />
                                    </InputGroup>
                                </Box>
                                {/* Password field */}
                                <Box>
                                    <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.03em" mb="2"
                                          color={TEXT_SUB} textTransform="uppercase">
                                        {t('login.password_label')}
                                    </Text>
                                    <InputGroup w="full" startElement={
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7A8494' }}>lock</span>
                                    } endElement={
                                        <IconButton variant="ghost" aria-label="Toggle password"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    size="sm" bg="transparent" color={TEXT_SUB}
                                                    _hover={{ bg: 'transparent', color: INK }}
                                                    _active={{ bg: 'transparent' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </IconButton>
                                    }>
                                        <Input type={showPassword ? 'text' : 'password'}
                                               value={password} onChange={(e) => setPassword(e.target.value)}
                                               placeholder="••••••••" size="lg" bg="white" color={TEXT_MAIN}
                                               border="1px solid" borderColor={INPUT_BORDER}
                                               borderRadius="md" h="11" fontSize="sm"
                                               _placeholder={{ color: '#9AA3AF' }}
                                               _focus={{ borderColor: SAGE, boxShadow: `0 0 0 1px ${SAGE}` }} />
                                    </InputGroup>
                                </Box>
                                {/* Remember me & forgot password */}
                                <Flex align="center" justify="space-between">
                                    <Checkbox.Root variant="subtle" checked={rememberMe}
                                                   onCheckedChange={(details) => setRememberMe(Boolean(details.checked))}>
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control border="1px solid" borderColor="gray.300"
                                                         _checked={{ bg: SAGE, borderColor: SAGE, color: 'white' }}
                                                         borderRadius="sm" />
                                        <Checkbox.Label fontSize="sm" color={TEXT_SUB}>
                                            {t('login.remember_me')}
                                        </Checkbox.Label>
                                    </Checkbox.Root>
                                    <Link fontSize="sm" fontWeight="semibold" color={SAGE_DARK}
                                          _hover={{ color: AMBER }} onClick={() => navigate('/forgot-password')}>
                                        {t('login.forgot_password')}
                                    </Link>
                                </Flex>
                                {/* Submit button */}
                                <Button w="full" h="12" bg={SAGE} color="white" fontSize="sm" fontWeight="bold"
                                        letterSpacing="0.02em" borderRadius="md" pos="relative" overflow="hidden"
                                        _hover={{ bg: SAGE_DARK }} _active={{ transform: 'scale(0.98)' }}
                                        type="submit" disabled={isSubmitting} loading={isSubmitting}>
                                    {t('login.submit')}
                                </Button>
                                {errorMessage && <SnackbarContent message={errorMessage} isError />}
                            </Stack>
                        </form>
                        <Text fontSize="xs" color={TEXT_SUB} textAlign="center" mt="8">
                            {t('login.protected_text')}
                        </Text>
                    </Box>
                </Flex>
            </Flex>
        </>
    );
};

const LoginForm = () => (
    <PageTransition>
        <LoginFormContent />
    </PageTransition>
);

export default LoginForm;
```

---

#### 6.5.21 — Pages Auth (ForgotPassword, LinkVerification, ResetPassword)

Due to the large size of this document, please refer to the source files directly for the complete implementation of:
- `frontend/src/pages/Auth/ForgotPassword.tsx`
- `frontend/src/pages/Auth/LinkVerification.tsx`
- `frontend/src/pages/Auth/ResetPassword.tsx`

These pages follow the same design system with:
- Dark hero panel with animated gradient background
- Clean card layout with form fields
- Snackbar notifications
- Internationalized text

---

#### 6.5.22 — Pages Dashboard

Please refer to the source file `frontend/src/pages/Dashboard/Dashboard.tsx` for the full implementation. It includes:
- 4 stat cards (Total Revenue, Orders, Stock Value, Low Stock)
- Sales performance SVG chart
- Stock distribution by category
- Recent orders table
- Stock alerts widget

---

#### 6.5.23 — Pages Products

Please refer to the source files for the complete implementation:
- `frontend/src/pages/Products/Products.tsx` — Tab container
- `frontend/src/pages/Products/ProductsListTabContent.tsx` — Product list with filters, sorting, grid/list view, pagination
- `frontend/src/pages/Products/CategoryListTabContent.tsx` — Category list with CRUD
- `frontend/src/pages/Products/modal/AddProductModal.tsx` — Add product dialog
- `frontend/src/pages/Products/modal/EditProductModal.tsx` — Edit product dialog
- `frontend/src/pages/Products/modal/AddCategoryModal.tsx` — Add category dialog
- `frontend/src/pages/Products/modal/ImportProductsModal.tsx` — Excel import dialog with xlsx parsing

---

#### 6.5.24 — Pages Stock

Please refer to `frontend/src/pages/Stock/Stock.tsx` for the full implementation. It includes:
- 3 stat cards (Total Products, Low Stock Alert, Out of Stock)
- Search and filter toolbar
- Product table with stock level controls (+/- buttons)
- Pagination

---

#### 6.5.25 — Pages Orders / Customers (Placeholder)

**Orders.tsx** and **Customers.tsx** are simple placeholder pages:
```tsx
import Sidebar from '../../components/navigation/sidebar';

const PageName = () => {
    return (
        <Sidebar>
            <div>
                <h1>PageName</h1>
            </div>
        </Sidebar>
    );
};
export default PageName;
```

---

#### 6.5.26 — Pages UsersProfile

Please refer to `frontend/src/pages/Users/UsersProfile.tsx` for the full implementation. It includes:
- Profile card with avatar upload
- Personal information editing (first name, last name, phone)
- Language preference selector (FR, EN, MG)
- Password change with validation criteria
- 2FA management display

---

#### 6.5.27 — frontend/src/hooks/useAppToast.js

Hook global pour afficher des toasts Chakra UI v3 sans dépendre du contexte React. Utilise `createToaster` (API v3) pour créer un `ToastContainer` rendu une seule fois dans `App.jsx`. Évite le JSX avec `createElement` pour rester en `.js`.

```js
import { createToaster, Toaster as ChakraToaster } from '@chakra-ui/react';
import { createElement } from 'react';

const toaster = createToaster({
  placement: 'bottom',
  overlap: true,
  gap: 16,
});

export const ToastContainer = () => createElement(ChakraToaster, { toaster });

export const useAppToast = () => {
  const showToast = ({
    title,
    description = '',
    status = 'success',
    duration = 3000,
  }) => {
    toaster.create({
      title,
      description,
      type: status,
      duration,
    });
  };

  return { showToast };
};
```

---

#### 6.5.28 — frontend/src/providers/QueryProvider.jsx

Provider TanStack Query (React Query v5) qui wrappe l'application dans `main.jsx`. Configure les options par défaut : `staleTime` de 5 min, 1 seule tentative de rafraîchissement, pas de refetch au focus.

```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export const QueryProvider = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
```

---

### 6.6 — infra/docker-compose.yml

Orchestration locale des 3 services (PostgreSQL, backend NestJS, frontend Nginx). Le backend charge les variables depuis le `.env` racine. Le frontend reçoit `VITE_API_URL` en build arg.

```yaml
services:
  db:
    image: postgres:15-alpine
    container_name: stock_postgres
    restart: always
    environment:
      POSTGRES_USER: \${DB_USER:-postgres}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-postgres}
      POSTGRES_DB: \${DB_NAME:-stock_management}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-postgres} -d \${DB_NAME:-stock_management}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ../backend
    container_name: stock_backend
    restart: always
    ports:
      - "3005:3005"
    env_file:
      - ../.env
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ../frontend
      args:
        VITE_API_URL: http://backend:3005
    container_name: stock_frontend
    restart: always
    ports:
      - "5173:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

### 6.7 — .github/workflows/docker-publish.yml

Workflow CI/CD qui build et push les images Docker vers GitHub Container Registry (GHCR) sur push vers `main` ou tag `v*.*.*`. Utilise une matrice pour builder backend et frontend en parallèle. Les tags publiés sont `latest` (branche main) + SHA court du commit.

```yaml
name: Docker Publish

on:
  push:
    branches: [main]
    tags: ['v*.*.*']

permissions:
  contents: read
  packages: write

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        service:
          - name: backend
            dockerfile: backend/Dockerfile
            context: backend
          - name: frontend
            dockerfile: frontend/Dockerfile
            context: frontend

    steps:
      - uses: actions/checkout@v4

      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/\${{ github.repository_owner }}/\${{ github.event.repository.name }}-\${{ matrix.service.name }}
          tags: |
            type=raw,value=latest,enable={{is_default_branch}}
            type=sha,prefix=,suffix=,format=short

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.repository_owner }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: \${{ matrix.service.context }}
          file: \${{ matrix.service.dockerfile }}
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          build-args: \${{ matrix.service.name == 'frontend' && format('VITE_API_URL={0}', vars.VITE_API_URL || 'https://api.stock.example.com') || '' }}
```

---

### 6.8 — GitHub Workflows

---

#### .github/workflows/ci-develop.yml

```yaml
name: CI Develop

on:
  push:
    branches:
      - develop
      - main

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        ports:
          - 5432:5432
        env:
          POSTGRES_PASSWORD: \${{ secrets.POSTGRES_PASSWORD }}

    env:
      DB_PASSWORD: \${{ secrets.POSTGRES_PASSWORD }}

    steps:
    - uses: actions/checkout@v3
    - name: Enable Corepack (pnpm)
      run: corepack enable && corepack prepare pnpm@10.34.4 --activate
    - uses: actions/setup-node@v3
      with:
        node-version: '22'
        cache: 'pnpm'
        cache-dependency-path: backend/pnpm-lock.yaml
    - name: Install Dependencies
      run: pnpm install --frozen-lockfile
      working-directory: ./backend
    - name: Run Linter
      run: pnpm run lint
      working-directory: ./backend
    - name: Build Application
      run: pnpm run build
      working-directory: ./backend
    - name: Run Tests
      run: pnpm run test
      working-directory: ./backend
```

#### .github/workflows/ci-feature.yml

```yaml
name: CI Feature

on:
  push:
    branches:
      - 'feature/**'
      - 'bugfix/**'

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    - name: Enable Corepack (pnpm)
      run: corepack enable && corepack prepare pnpm@10.34.4 --activate
    - uses: actions/setup-node@v3
      with:
        node-version: '22'
        cache: 'pnpm'
        cache-dependency-path: backend/pnpm-lock.yaml
    - name: Install Dependencies
      run: pnpm install --frozen-lockfile
      working-directory: ./backend
    - name: Run Linter
      run: pnpm run lint
      working-directory: ./backend
    - name: Build Application
      run: pnpm run build
      working-directory: ./backend
```

---

### 6.9 — frontend/i18n.js

Due to the large size, please refer to the source file `frontend/src/i18n.js` for the complete internationalization data.

Languages supported: **English (EN)**, **Français (FR)**, **Malagasy (MG)**

Namespaces include:
- `common` — Loading, cancel, save, delete, edit
- `dashboard` — Overview, stats, charts, orders, alerts
- `profile` — Information, preferences, security, password
- `sidebar` — Navigation labels, logout
- `products` — Product/category list, CRUD, import
- `stock` — Stock management labels, statuses, pagination
- `login` — Login form, hero text, errors
- `auth` — Forgot/reset password flow

---

## Fin du document
