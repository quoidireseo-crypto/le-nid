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

### f) Activer les vraies notifications push (optionnel, avancé)

Pour que les notifications réveillent le téléphone **même appli fermée** :

1. **SQL Editor** → **New query** → contenu de `supabase-notifications.sql` → **Run** (crée la table `subscriptions`).
2. Générer une paire de clés VAPID : `npx web-push generate-vapid-keys`.
3. Poser les secrets de la fonction :
   ```bash
   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:vous@exemple.fr
   supabase functions deploy pousser-notifications
   ```
4. **Database → Webhooks** : créer un webhook sur la table `nids`, événement **UPDATE**, vers la fonction `pousser-notifications`.
5. Côté appli : ajouter `VITE_VAPID_PUBLIC_KEY=<clé publique>` (dans `.env.local` et sur Vercel).

Sans ces étapes, l'appli reste pleinement fonctionnelle : les notifications se limitent au navigateur ouvert (comme avant).

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

- **Deux modes.** Par défaut (aucune variable `VITE_NID_CODE`), l'appli est en **mode produit multi-foyer** : au premier lancement, on choisit **« Créer notre Nid »** (l'appli génère une clé du style `tendre-tilleul-84`) ou **« Rejoindre un Nid existant »**. Si vous définissez `VITE_NID_CODE`, l'appli reste en **mode mono-famille verrouillé** (comportement historique : une seule maison, une seule clé fixe).
- **Inviter la famille (mode produit)** : sur la Maison, la carte **« 💌 Inviter la famille »** partage un **lien d'invitation** (`…?nid=tendre-tilleul-84`). En l'ouvrant, l'invité arrive directement sur l'écran « Rejoindre » avec la clé **déjà pré-remplie** — un seul geste, idéal pour les grands-parents. Bouton **Partager** natif (WhatsApp, SMS…) ou **Copier le lien**.
- **Garder les données d'un ancien Nid** : si votre famille avait déjà un Nid (ex. clé `tendre-tilleul-84`), mettez cette clé comme valeur de `VITE_NID_CODE` — elle devient la clé officielle de la maison et toutes les données existantes sont conservées.
- **Niveau de sécurité, honnêtement** : la clé est vérifiée dans l'application elle-même, ce qui protège très bien contre les curieux et les visiteurs de passage, mais une personne très technique pourrait la retrouver en fouillant le code de la page. C'est une serrure de maison familiale, pas un coffre de banque — parfaitement adapté à cet usage.
- **Qui êtes-vous ?** — au premier lancement sur chaque appareil, on choisit son avatar. C'est ce qui permet à vos messages et vos post-its de porter le bon nom.
- **Ça marche aussi hors-ligne** : sans connexion, l'appli continue de fonctionner sur les données déjà chargées (grâce au filet de sécurité localStorage), et se resynchronise dès que la connexion revient.
- **« changer de foyer »**, en petit sous le titre de la Maison, permet de sortir d'un Nid et d'en rejoindre un autre (utile pour les tests, ou si un membre appartient à deux familles).

## Installer sur le téléphone (PWA)

L'appli est **installable** : sur le lien Vercel, le navigateur propose « Ajouter à l'écran d'accueil » (menu ⋮ sur Android, bouton Partager sur iPhone). Elle s'ouvre alors en plein écran comme une vraie app, et fonctionne hors-ligne sur les données déjà chargées.

## Limites actuelles (honnêtes)

- Le Salon accepte le texte **et la voix** (notes vocales, si le stockage Supabase est activé). La fausse démo d'appel a été retirée ; de vrais appels vidéo (WebRTC) restent un chantier d'infrastructure à part, non prioritaire face à la force du modèle asynchrone.
- Les photos du Frigo **et les albums du Grenier** sont réelles (importées depuis l'appareil) dès que le stockage Supabase est activé. Le bouton **« 🖨️ Livre photo »** du Grenier met en page les albums pour l'impression (l'amorce d'une future commande de livre imprimé).
- Le **Quiz du Jardin est vivant** : ses questions sont générées à partir du vrai contenu de la famille (recettes, frigo, événements), et complétées par quelques questions types quand le Nid est encore peu rempli.
- **Notifications** : par défaut, ce sont des notifications navigateur (appli ouverte). Les **vraies notifications push** qui réveillent le téléphone appli fermée sont désormais disponibles en option — voir la section 2f (table `subscriptions` + fonction Edge `pousser-notifications` + clés VAPID).
- La sécurité repose sur la clé du foyer, pas sur un vrai compte utilisateur avec mot de passe — suffisant pour un usage familial de confiance, mais à faire évoluer si le projet grandit.
- Un **nouveau foyer démarre désormais vierge** (plus de fuite des données de démo « Dupont ») : chaque famille remplit son propre Nid. Les données de démo ne servent qu'à l'aperçu local, quand Supabase n'est pas branché.
- Le nom de famille est modifiable (icône ✏️ sur la Maison), mais les prénoms des membres restent ceux de la démo pour l'instant.

## Accessibilité

Police de corps **Atkinson Hyperlegible** (conçue pour la lisibilité des personnes malvoyantes), taille de base généreuse, focus clavier visible, animations désactivées si `prefers-reduced-motion`.
