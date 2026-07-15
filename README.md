# 🪺 Le Nid

*La maison de famille, dans votre poche.*

Un réseau social privé, chaleureux et intergénérationnel, construit autour de la métaphore de la maison : le Salon (messages), le Frigo (tableau magnétique partagé), la Cuisine (recettes), le Grenier (souvenirs) et le Jardin (quiz familial en différé).

Avec Supabase branché, **toute la famille voit les mêmes données en temps réel, depuis des appareils différents.**

---

## 1. Lancer en local (sans synchronisation)

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173 — l'appli fonctionne, mais chaque appareil a ses propres données (localStorage). C'est le mode par défaut si vous ne configurez rien.

---

## 2. Activer la synchronisation Supabase (gratuit)

### a) Créer le projet

1. Allez sur [supabase.com](https://supabase.com) → **Start your project** → connectez-vous avec GitHub (c'est gratuit, pas de carte bancaire demandée).
2. **New project** : donnez-lui un nom (ex. `le-nid`), choisissez un mot de passe de base de données (à garder de côté), et une région proche de vous (ex. `eu-west-1` pour la France).
3. Attendez ~2 minutes que le projet soit prêt.

### b) Créer la table

1. Dans le menu de gauche : **SQL Editor** → **New query**.
2. Copiez-collez tout le contenu du fichier `supabase-setup.sql` (fourni dans ce dossier) et cliquez sur **Run**.
3. Ça crée la table `nids` et active la synchronisation en temps réel.
4. **New query** à nouveau, cette fois avec le contenu de `supabase-push.sql`, puis **Run**. Ça installe l'écriture atomique (contrôle de concurrence) : deux personnes qui postent en même temps ne s'écrasent plus.

### c) Récupérer vos clés

1. Menu de gauche : **Project Settings** (⚙️) → **API**.
2. Notez deux valeurs : **Project URL** et **anon public key**.

### d) Configurer l'appli en local

1. Dupliquez `.env.example` en `.env.local` :
   ```bash
   cp .env.example .env.local
   ```
2. Ouvrez `.env.local` et collez vos valeurs :
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxx
   ```
3. Relancez `npm run dev`. Au premier lancement, l'appli propose de **créer votre Nid** — elle génère une clé du style `tendre-tilleul-84` à partager avec la famille.

### e) Activer le stockage des vraies photos (optionnel)

1. Toujours dans **SQL Editor** → **New query**.
2. Copiez-collez le contenu de `supabase-storage.sql` et cliquez **Run**.
3. Ça crée un espace de stockage nommé `photos`. Le bouton "📷 Ajouter une photo" du Frigo fonctionne dès que c'est fait.

---

## 3. Déployer sur Vercel

1. Poussez ce dossier sur GitHub :
   ```bash
   git init
   git add .
   git commit -m "Le Nid — premier envol"
   git branch -M main
   git remote add origin https://github.com/VOTRE-COMPTE/le-nid.git
   git push -u origin main
   ```
2. Sur [vercel.com](https://vercel.com) : **Add New → Project → Import** votre dépôt `le-nid`.
3. **Avant de cliquer sur Deploy**, ouvrez **Environment Variables** et ajoutez les deux mêmes clés que dans `.env.local` (`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`).
4. **Deploy**. Vercel détecte Vite automatiquement.

Chaque membre de la famille ouvre le lien Vercel sur son téléphone, saisit la clé du foyer (`tendre-tilleul-84` par exemple), choisit son avatar — et voilà, tout le monde est synchronisé.

---

## Comment ça marche, en clair

- **Une seule maison, une seule clé** : il n'y a qu'un foyer, celui de votre famille. À la première ouverture, chacun doit saisir LA clé de la maison (définie par la variable d'environnement `VITE_NID_CODE` sur Vercel — par défaut `notre-maison`). Une fois la clé validée, l'appareil s'en souvient : on ne la retape jamais.
- **Transmettre la clé** : envoyez le lien + la clé par SMS ou WhatsApp aux membres de la famille. Sans la clé, on reste à la porte.
- **Garder les données d'un ancien Nid** : si votre famille avait déjà un Nid (ex. clé `tendre-tilleul-84`), mettez cette clé comme valeur de `VITE_NID_CODE` — elle devient la clé officielle de la maison et toutes les données existantes sont conservées.
- **Niveau de sécurité, honnêtement** : la clé est vérifiée dans l'application elle-même, ce qui protège très bien contre les curieux et les visiteurs de passage, mais une personne très technique pourrait la retrouver en fouillant le code de la page. C'est une serrure de maison familiale, pas un coffre de banque — parfaitement adapté à cet usage.
- **Qui êtes-vous ?** — au premier lancement sur chaque appareil, on choisit son avatar. C'est ce qui permet à vos messages et vos post-its de porter le bon nom.
- **Ça marche aussi hors-ligne** : sans connexion, l'appli continue de fonctionner sur les données déjà chargées (grâce au filet de sécurité localStorage), et se resynchronise dès que la connexion revient.
- **« changer de foyer »**, en petit sous le titre de la Maison, permet de sortir d'un Nid et d'en rejoindre un autre (utile pour les tests, ou si un membre appartient à deux familles).

## Installer sur le téléphone (PWA)

L'appli est **installable** : sur le lien Vercel, le navigateur propose « Ajouter à l'écran d'accueil » (menu ⋮ sur Android, bouton Partager sur iPhone). Elle s'ouvre alors en plein écran comme une vraie app, et fonctionne hors-ligne sur les données déjà chargées.

## Limites actuelles (honnêtes)

- Les appels vidéo du Salon sont une démo (pas de vrai flux vidéo).
- Les photos du Frigo sont réelles (importées depuis l'appareil) si le stockage Supabase est activé ; les albums du Grenier restent illustrés par des emoji pour l'instant.
- **Notifications** : ce sont des notifications navigateur, qui fonctionnent quand l'appli est ouverte (même en arrière-plan sur la plupart des téléphones). Elles ne réveillent pas le téléphone si l'appli est complètement fermée — pour ça, il faudrait un vrai service de "push" avec un serveur dédié, une étape plus avancée.
- La sécurité repose sur la clé du foyer, pas sur un vrai compte utilisateur avec mot de passe — suffisant pour un usage familial de confiance, mais à faire évoluer si le projet grandit.
- Un **nouveau foyer démarre désormais vierge** (plus de fuite des données de démo « Dupont ») : chaque famille remplit son propre Nid. Les données de démo ne servent qu'à l'aperçu local, quand Supabase n'est pas branché.
- Le nom de famille est modifiable (icône ✏️ sur la Maison), mais les prénoms des membres restent ceux de la démo pour l'instant.

## Accessibilité

Police de corps **Atkinson Hyperlegible** (conçue pour la lisibilité des personnes malvoyantes), taille de base généreuse, focus clavier visible, animations désactivées si `prefers-reduced-motion`.
