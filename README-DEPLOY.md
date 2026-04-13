# Smart Atelier - Guide de deploiement

Ce fichier sert de checklist avant la mise en production. Ne jamais committer les fichiers `.env`, `.env.local`, les sauvegardes de base de donnees ou les fichiers uploades par les utilisateurs.

## Variables d'environnement

Configurer ces variables sur l'hebergeur, par exemple Vercel, Railway, Render ou le serveur VPS :

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
NEXTAUTH_SECRET=remplacer-par-un-secret-long-et-fort
NEXTAUTH_URL=https://votre-domaine.com
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
APP_NAME=Smart Atelier
APP_ENV=production
UPLOAD_DIR=./public/uploads
```

Variables utiles seulement si vous lancez un seed en production :

```env
SEED_ADMIN_NAME=Super Admin
SEED_ADMIN_EMAIL=admin@mwinda.cd
SEED_ADMIN_PASSWORD=remplacer-par-un-mot-de-passe-fort
```

Variables non utilisees actuellement dans le code :

```env
JWT_SECRET=
DIRECT_URL=
```

## Commandes de deploiement

Installer les dependances :

```bash
npm install
```

Verifier Prisma :

```bash
npx prisma validate
npx prisma generate
```

Appliquer les migrations en production :

```bash
npx prisma migrate deploy
```

Construire l'application :

```bash
npm run build
```

Lancer l'application :

```bash
npm run start
```

## Verification apres mise en ligne

Tester rapidement ces points :

- `/api/health` repond avec `ok: true`.
- La page `/login` charge correctement.
- La connexion fonctionne avec un compte actif.
- La deconnexion renvoie bien vers `/login`.
- Le menu de gauche affiche seulement les modules autorises.
- Les modules clients, commandes, coupe, production, qualite, livraison, stock, RH et comptabilite s'ouvrent sans nouvelle fenetre.
- La creation d'une commande fonctionne.
- Les mouvements de stock et achats stock fonctionnent.
- Les permissions utilisateur sont bien appliquees.

## Notes de securite

- Utiliser un `NEXTAUTH_SECRET` long et unique en production.
- Ne pas utiliser `dev-secret` en production.
- Ne pas utiliser une base `localhost` en production.
- Garder les routes `_debug` inaccessibles en production.
- Faire un backup PostgreSQL avant toute migration.
- Ne pas versionner `public/uploads`.
