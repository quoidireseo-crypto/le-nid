# 🪺 Le Nid — Feuille de route d'engagement & de croissance

*Analyse produit / UX / psychologie de l'engagement — et plan pour atteindre un niveau d'excellence « niveau TikTok », appliqué à un produit familial intime.*

---

## ✅ État d'avancement (implémenté)

Les quatre phases du plan séquencé ont été implémentées et vérifiées (build + tests de logique pure + smoke tests navigateur) :

- **Phase 0 — Fondations** : moteur de synchronisation à concurrence optimiste (fin du « dernier qui écrit gagne »), horodatages ISO, PWA installable + service worker, onboarding vierge (fin de la fuite des données de démo).
- **Phase 1 — Rétention** : La Question du Nid (rituel quotidien type BeReal), Réactions + « Vu par », La Flamme du Nid (streak collectif).
- **Phase 2 — Croissance** : multi-foyer + invitation par lien (`?nid=`) et partage natif, souvenirs « Ce jour-là », socle des vrais push (table `subscriptions` + fonction Edge, déploiement documenté).
- **Phase 3 — Différenciation** : Quiz vivant (généré depuis les vraies données), Grenier collaboratif (vraies photos + albums), notes vocales au Salon, livre photo imprimable, retrait de la fausse démo d'appel.

Restent volontairement hors périmètre (infra lourde / paiements) : les appels vidéo temps réel (WebRTC) et la monétisation par paiement (abonnement Nid+, commande de livre imprimé) — le livre photo imprimable en pose l'amorce.

---

## Partie 1 — Diagnostic de l'existant

### 1.1 But principal & problème résolu

**Le Nid est la « maison de famille numérique »** : un réseau social **privé, chaleureux et intergénérationnel** (grands-parents → petits-enfants). La métaphore de la maison structure toute l'expérience — chaque pièce est une activité :

| Pièce | Rôle | État |
|---|---|---|
| 🏠 **Maison** | Tableau de bord : façade animée, agenda « Bientôt au Nid », avatars de la famille | Fonctionnel |
| 💬 **Salon** | Une seule conversation familiale + boutons d'appel | Chat réel ; appels = **démo (setTimeout)** |
| 🧲 **Frigo** | Tableau magnétique : post-its, polaroïds (vraies photos), listes à cocher | Fonctionnel, photos réelles via Supabase Storage |
| 🍲 **Cuisine** | Livre de recettes de famille avec « le secret » + « Je l'ai faite ! » | Fonctionnel |
| 📸 **Grenier** | Albums souvenirs + « souvenir du dimanche » | **Albums = emoji, souvenir = statique** |
| 🌳 **Jardin** | Quiz familial asynchrone + classement | Fonctionnel mais **8 questions figées** (famille Dupont) |

**Problème résolu :** maintenir le lien familial à distance et entre générations, dans un espace privé et bienveillant — l'**anti-réseau social public**. Sa proposition de valeur est l'**opposée** de l'économie de l'attention.

### 1.2 Public cible & contexte d'usage

- **Cœur de cible :** familles multigénérationnelles, incluant explicitement les **55+ / grands-parents** (choix de la police **Atkinson Hyperlegible**, taille de base 17px, focus clavier visible, `prefers-reduced-motion`).
- **Contexte :** **mobile-first** (cadre « téléphone » `max-width: 460px`), usage domestique, confiance totale entre membres. Ce n'est ni un outil interne ni un réseau public — c'est un **cercle fermé de confiance**.

### 1.3 Stack technique

- **Front :** React 18 + Vite 5, **sans routeur** (onglet = `useState`), **sans TypeScript**. ~2000 lignes, très lisible.
- **Back :** Supabase — **une seule table** `nids (code PK, donnees jsonb, updated_at)`. Realtime via `postgres_changes`. Storage bucket `photos`.
- **Auth :** **pas de vrais comptes.** Un unique « code du foyer » (`VITE_NID_CODE`) sert de mot de passe partagé. L'identité = un id membre en `localStorage` + prénom/emoji ajoutés à la map partagée `membres`.
- **Persistance :** tout l'état de la famille = **un seul blob JSON** poussé/tiré en entier. Filet `localStorage` pour l'offline.
- **Notifications :** `Notification` navigateur **uniquement quand l'app est ouverte** (pas de push serveur).

### 1.4 Boucles d'engagement déjà présentes

- ✅ **Signal d'ambiance fort** : les fenêtres de la maison **s'allument** quand une pièce a de l'activité (`allumee`) — preuve sociale passive, élégante.
- ✅ **Notifications** sur nouveau message Salon / nouvel item Frigo (mais app ouverte seulement).
- ✅ **Classement du Quiz** (compétence + compétition douce, records personnels).
- ✅ **« Je l'ai faite ! »** sur les recettes (preuve sociale + accomplissement).
- ✅ **Compte à rebours d'événements** (« Bientôt au Nid ») — anticipation.
- ✅ **« Souvenir du dimanche »** — crochet nostalgique (mais **statique**).

### 1.5 Signaux faibles de viralité (déjà dans le code !)

- 🔑 **Partage de clé** par SMS/WhatsApp = mécanique d'invitation… mais **manuelle et hors-app**.
- 🌱 **`genererCode` / `creerNid` / `rejoindreNid`** existent déjà dans `sync.js` — **toute la plomberie multi-foyer est là, dormante**, jamais branchée à un vrai parcours.
- 🌱 **UGC partout** : messages, post-its, photos, recettes, scores — le contenu généré par les utilisateurs est le cœur du produit.

### 1.6 Freins UX & dette technique (à traiter en priorité)

| # | Frein | Impact |
|---|---|---|
| **A** | **Concurrence : « dernier qui écrit gagne ».** `pousserDonnees` réécrit **tout le blob JSON**. Deux personnes qui postent en même temps → **perte de données silencieuse.** | 🔴 Critique — bloque toute montée en engagement (plus d'écritures = plus de collisions) |
| **B** | **Pas de vraies dates.** Les messages ne stockent que `"9:12"`, pas de timestamp ISO. | 🟠 Bloque souvenirs, streaks, tri chronologique |
| **C** | **Pas de PWA installable** (ni manifest, ni service worker). | 🟠 Bloque le push et la promesse « dans votre poche » |
| **D** | **Les données de démo (famille Dupont) fusionnent** avec les vraies via `completer()`. | 🟠 Friction d'onboarding, impression de « produit pas à moi » |
| **E** | **Foyer unique par déploiement** + RLS `using(true)`. | 🟠 Empêche le multi-famille sans redéploiement ; à durcir pour un vrai produit |
| **F** | **Fonctions « fantômes »** : appels vidéo = démo, albums Grenier = emoji. | 🟡 Érode la confiance (promesses non tenues) |

---

## Partie 2 — Cadrage stratégique : « niveau TikTok », honnêtement

> **Attention — le piège à éviter.** TikTok, c'est le scroll infini, le contenu d'inconnus, la récompense-machine-à-sous, l'extraction d'attention. **Copier ce modèle tuerait Le Nid**, dont toute la valeur est l'intimité familiale finie et bienveillante.

Ce qu'on emprunte à TikTok, ce n'est **pas son modèle de contenu**, c'est sa **discipline de rétention et son artisanat** : une raison **garantie** de revenir chaque jour, une friction de participation quasi nulle, une boucle d'habitude parfaitement huilée. **BeReal est le meilleur nord** que TikTok pour ce produit : rituel quotidien, prompt, réciprocité (« tu postes pour voir »), authenticité, faible pression.

**On adapte donc les *mécaniques comportementales* (récompense variable, streaks, preuve sociale, réciprocité, Zeigarnik, nostalgie) au service du lien familial — pas de l'extraction d'attention.**

---

## Partie 3 — Fonctionnalités priorisées (de la plus impactante à la plus secondaire)

### 🥇 1. La Question du Nid — *rituel quotidien (type BeReal)*
**Description.** Chaque jour, un prompt doux et rotatif (« Ta photo du jour », « Une chose qui t'a fait sourire ? », « C'est quoi le dîner ce soir ? »). Chacun répond à son rythme ; **on ne voit les réponses des autres qu'après avoir posté la sienne.**

- **Insight comportemental.** Rituel/habitude quotidienne + **effet Zeigarnik** (boucle ouverte tant qu'on n'a pas répondu) + **réciprocité** (mécanique BeReal du « poste pour voir ») + **récompense variable** (qu'a partagé la famille ?).
- **Valeur.** **LE moteur du DAU.** Transforme un usage sporadique en habitude quotidienne. Cible directement rétention J7/J30.
- **Faisabilité.** Réutilise le pattern `QUIZ` (banque de prompts) + `setDonnees`. Nouveau champ `reponsesDuJour` dans le jsonb, rotation par date. **Effort faible.**
- **Priorité : 🔴 HAUTE** (impact max / effort faible).

### 🥈 2. Réactions & « Vu par » — *réciprocité à coût nul*
**Description.** Réagir d'un tap (❤️😂🥰👏) à un message, un post-it, une photo ; afficher « vu par Mamie, Papi ».

- **Insight.** **Validation sociale à renforcement variable** + **co-présence ambiante**. Surtout : participation **sans écrire** — les grands-parents qui ne tapent pas taperont un ❤️.
- **Valeur.** Abaisse radicalement le coût de participation → plus d'interactions par membre actif, plus de raisons de revenir (« a-t-on réagi à ma photo ? »).
- **Faisabilité.** Champ `reactions: {emoji: [ids]}` sur chaque entité. Pur `setDonnees`. **Effort faible** — **mais** amplifie le risque de concurrence (voir Fondation 0).
- **Priorité : 🔴 HAUTE**.

### 🥉 3. La Flamme du Nid — *streak collectif*
**Description.** Un streak **collectif** : nombre de jours consécutifs où la famille a été active ensemble. Matérialisé par **la fumée de la cheminée** (déjà animée sur la Maison !) qui devient flamme.

- **Insight.** **Aversion à la perte** + **progrès doté** (endowed progress) + **responsabilité sociale collective** (« je ne veux pas casser la série de Mamie » — bien plus puissant qu'un streak individuel type Snapchat).
- **Valeur.** Multiplicateur de rétention, spécifiquement adapté à un groupe soudé (culpabilité bienveillante > compétition).
- **Faisabilité.** Dérivé des timestamps du jsonb (dépend de la Fondation B). La cheminée existe déjà comme réceptacle visuel. **Effort faible-moyen.**
- **Priorité : 🔴 HAUTE**.

### 4. Vrais push notifications (PWA + Web Push) — *le déclencheur*
**Description.** Manifest + service worker (app installable) + Supabase Edge Function + `web-push` (VAPID) pour réveiller le téléphone même app fermée.

- **Insight.** Le **Trigger** du modèle B=MAP (BJ Fogg) : sans déclencheur, pas d'habitude. C'est le chaînon manquant qui active toutes les autres boucles (prompt du jour, flamme, souvenir).
- **Valeur.** **Le plus grand levier technique de rétention/réactivation.** Aujourd'hui les notifs ne servent quasi à rien (app ouverte only).
- **Faisabilité.** Plus lourd : SW + manifest + clés VAPID + Edge Function de fan-out sur changement DB + table `subscriptions`. Supabase le permet nativement. **Effort moyen-élevé.**
- **Priorité : 🔴 HAUTE (structurante)**.

### 5. Multi-foyer réel + invitation in-app — *la boucle virale*
**Description.** Brancher les primitives dormantes (`genererCode`/`creerNid`/`rejoindreNid`) sur un vrai parcours **créer / rejoindre**, avec **invitation in-app** (Web Share API + lien profond `?nid=code` + **QR code**), pour que **n'importe quelle famille** crée son Nid sans redéploiement.

- **Insight.** **Boucle virale** + effets de réseau — et l'invitation est **intrinsèquement motivée** (on *veut* Mamie dans le Nid, pas par obligation marketing).
- **Valeur.** **LE déblocage de croissance** : passe d'un déploiement mono-famille à un vrai produit. Ouvre le **coefficient viral** et la porte de la monétisation (par foyer).
- **Faisabilité.** Plomberie déjà là — surtout de l'UI (écrans onboarding, deep-link, QR, partage). Durcir RLS **par code** + limitation de débit. **Effort moyen.**
- **Priorité : 🟠 HAUTE, mais séquencée** (change le positionnement « app de notre famille » → « produit »).

### 6. « Ce jour-là » — *nostalgie qui refait surface*
**Description.** Faire **remonter automatiquement** photos/messages passés (« il y a 1 an aujourd'hui »). Rendre **dynamique** le « souvenir du dimanche » aujourd'hui figé.

- **Insight.** **Nostalgie = récompense émotionnelle puissante** + **règle du pic-fin** + récompense variable (« que va-t-on ressortir ? »).
- **Valeur.** Rétention + lien émotionnel + excellent **prétexte de notification** de réactivation.
- **Faisabilité.** Requête par date sur frigo/messages → **dépend de la Fondation B (dates réelles)**. **Effort moyen.**
- **Priorité : 🟠 MOYENNE-HAUTE**.

### 7. Le Jardin qui pousse — *quiz vivant généré des vraies données*
**Description.** Au lieu de 8 questions figées Dupont, **générer les questions à partir du contenu réel** de la famille (recettes, photos, événements, « qui a posté X ? »). Quiz frais chaque semaine.

- **Insight.** **Récompense variable + personnalisation + curiosité + compétence.** Rejouabilité.
- **Valeur.** Transforme une nouveauté one-shot en boucle hebdomadaire, et renforce le cœur émotionnel (« à quel point connais-tu ta famille ? »).
- **Faisabilité.** Génération par templates depuis le jsonb (réutilise le pattern `QUIZ`). Sans IA au départ ; une Edge Function + LLM pourrait la sublimer ensuite. **Effort moyen.**
- **Priorité : 🟡 MOYENNE**.

### 8. Grenier réel & albums collaboratifs — *le coffre qui grandit*
**Description.** De vrais albums photo (le Storage Supabase est **déjà branché** pour le Frigo !), **collaboratifs** : chacun ajoute aux albums partagés, auto-rangés par événement.

- **Insight.** **Effet IKEA / dotation** (co-création) + Zeigarnik (album « incomplet ») + UGC.
- **Valeur.** Approfondit le **coût de changement émotionnel** (l'histoire de la famille vit ici) = anti-churn de long terme.
- **Faisabilité.** Étend `uploaderPhoto` aux albums, Storage déjà là. **Effort moyen.**
- **Priorité : 🟡 MOYENNE**.

### 9. Le Nid vocal — *notes vocales & dictée*
**Description.** Messages vocaux au Salon (les grands-parents **parlent** mieux qu'ils ne tapent), post-it dicté.

- **Insight.** **Accessibilité = engagement** (débloque les membres les moins numériques) + chaleur d'une vraie voix (richesse émotionnelle).
- **Valeur.** Fait participer les membres 55+ = densité du réseau complète. Différenciateur vs chat générique.
- **Faisabilité.** `MediaRecorder` + Storage Supabase. **Effort moyen.**
- **Priorité : 🟡 MOYENNE-BASSE**.

### 10. Vrais appels vidéo (remplacer la démo)
- **Insight.** Co-présence synchrone, rituel « appel du dimanche ».
- **Valeur.** Forte émotionnellement mais lourde ; l'asynchrone reste la force du produit.
- **Faisabilité.** WebRTC / Daily / LiveKit — **effort élevé**.
- **Priorité : 🟢 BASSE.** ⚠️ En attendant, **masquer** les boutons « démo » qui érodent la confiance.

### 11. Occasions & rôles (« l'esprit du Nid »)
- Rappels d'anniversaire qui **déclenchent une action** (cagnotte cadeau collective, carte signée à plusieurs), rôles doux (« gardien des souvenirs »).
- **Insight.** Identité de rôle + réciprocité + déclencheurs événementiels. **Valeur.** Engagement récurrent par occasions + porte de monétisation (cadeau groupé, livre photo). **Priorité : 🟢 BASSE (plus tard).**

### 12. Monétisation « Le Nid+ »
- **Livre photo annuel imprimé** (Grenier → objet physique), stockage premium, plus de membres par foyer.
- **Insight.** Dotation + coût irrécupérable + don. **Valeur.** Revenu **aligné sur la valeur cœur** (les souvenirs), **sans publicité** (la pub briserait le modèle de confiance). **Priorité : 🟢 BASSE maintenant**, mais stratégique.

---

## Partie 4 — Vision « niveau TikTok »

### Les 3 piliers d'expérience

1. **Le rituel quotidien** *(et non le scroll infini).* Le génie de TikTok n'est pas le feed, c'est la **raison garantie de revenir chaque jour**. Version Le Nid : **Question du Nid + Flamme + push** — chaleureuse et finie, jamais extractive.

2. **La réciprocité intime.** Rendre le coût de participation **quasi nul** (réactions, « vu par », voix, « poste pour voir ») pour que **chaque** membre — surtout les grands-parents — contribue. C'est cette densité sociale qui rend l'app « addictive à consulter ».

3. **Le coffre aux trésors qui grandit.** Souvenirs, streaks, recettes accumulés créent un **coût de changement émotionnel** et des boucles de nostalgie. Plus on reste, plus ça vaut : le **fossé anti-churn**. La résurgence (« Ce jour-là ») transforme l'archive en récompense récurrente.

### Plan séquencé

| Phase | Contenu | Durée | Objectif |
|---|---|---|---|
| **0 — Fondations** | Dates réelles (B) · PWA installable (C) · **durcissement concurrence** (RPC d'append ou migration par-entité pour les entités à forte écriture) (A) · onboarding vide, fin de la fuite Dupont (D) | ~2-3 sem. | *Débloque tout le reste* |
| **1 — Quick wins rétention** | **Question du Nid** · **Réactions + Vu par** · **Flamme du Nid** | ~3-4 sem. | DAU, J1/J7 |
| **2 — Croissance structurante** | **Vrais push** · **Multi-foyer + invitation/QR/deep-link** · **« Ce jour-là »** | ~4-6 sem. | J30 + coefficient viral |
| **3 — Différenciation** | Quiz vivant · Grenier collaboratif · Notes vocales → puis **Nid+ / livre photo**, éventuellement appels réels | ~6-8 sem.+ | Fossé + revenu |

> ⚠️ **La Fondation 0-A (concurrence) doit précéder** la Phase 1 : réactions et prompt du jour **augmentent** la fréquence d'écriture, donc les collisions de blob. La corriger avant, c'est éviter de bâtir l'engagement sur du sable.

### Signaux à tracker par étape

**North star (adapté à un réseau fermé) :** non pas le temps passé brut, mais **le taux de participation du foyer** = *% des membres actifs chaque semaine* et **nombre de jours/semaine où toute la famille s'est connectée**. Complété par le **DAU/MAU (stickiness ≥ 0,5 = excellent pour un usage familial)**.

- **Phase 0 :** taux de perte de données/collisions (→ 0), taux d'installation PWA, complétion de l'onboarding.
- **Phase 1 :** rétention J1/J7, **taux de réponse à la Question du Nid**, réactions par membre actif, distribution de longueur des flammes, sessions/jour.
- **Phase 2 :** taux d'opt-in push, **CTR push→ouverture**, **coefficient viral K = invitations × taux de conversion**, conversion invitation→adhésion, foyers créés, membres par foyer, rétention J30, **taux de résurrection** (dormant→actif via push « Ce jour-là »).
- **Phase 3 :** recettes/albums créés par foyer, participation hebdo au quiz, adoption du vocal par le segment 55+, conversion Nid+, ARPPU.

> 🧭 **Garde-fou éthique & de marque.** Contrairement à TikTok, **ne pas optimiser le temps passé brut.** L'optimum de ce produit est la **fréquence et la chaleur de la connexion**, pas la durée d'attention captée. Surveiller que l'engagement reste sain (pas de mécaniques anxiogènes, streaks pardonnants type « joker », zéro publicité). C'est ce qui rend Le Nid **mémorable** là où TikTok rend seulement **captif**.
