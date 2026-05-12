# 📦 Système d'Import de Données - Documentation Complète

## Vue d'ensemble

Ce système permet d'importer de grandes quantités de données (produits, clients, commandes, images) de manière sécurisée, modulaire et maintenable.

### Caractéristiques

- ✅ **Modulaire** : Chaque aspect (produits, clients, images) est géré par un service dédié
- ✅ **Transactions** : Toutes les opérations BD utilisent les transactions (rollback en cas d'erreur)
- ✅ **Validation** : Validation stricte de chaque ligne de données
- ✅ **Logs** : Enregistrement détaillé de toutes les opérations
- ✅ **Gestion d'erreurs** : Erreurs non-bloquantes (ligne par ligne)
- ✅ **Performance** : Insertion batch et index optimisés
- ✅ **Clean Code** : Fonctions petites (< 30 lignes), bien nommées

---

## 📁 Architecture du Projet

```
backend/
├── config/
│   └── database.php              # Configuration et chemins
├── src/
│   ├── controllers/
│   │   └── ImportController.php  # Orchestrateur principal
│   ├── services/
│   │   ├── ProduitImportService.php
│   │   ├── DetailProduitImportService.php
│   │   ├── ClientImportService.php
│   │   └── ImageImportService.php
│   └── utils/
│       ├── Logger.php            # Gestion des logs
│       ├── CsvReader.php         # Lecteur CSV
│       ├── Validator.php         # Validation des données
│       └── DatabaseConnection.php # Connexion PDO
├── api/
│   └── import.php                # Point d'entrée HTTP
├── logs/                         # Dossier des logs (auto-créé)
├── uploads/
│   └── images/                   # Images importées
├── DATABASE_SCHEMA.sql           # Schéma de la BD
└── USAGE_EXAMPLE.php             # Exemples d'utilisation
```

---

## 🚀 Mise en Place

### 1️⃣ Créer la Base de Données

```sql
-- Copier le contenu de DATABASE_SCHEMA.sql
-- Et l'exécuter dans votre SGBD
mysql -u root < backend/DATABASE_SCHEMA.sql
```

### 2️⃣ Configurer la Connexion

Éditer `backend/config/database.php` :

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'votre_base');
define('DB_USER', 'root');
define('DB_PASSWORD', 'votre_motdepasse');
```

### 3️⃣ Créer les Dossiers

```bash
mkdir backend/logs
mkdir backend/uploads/images
chmod 755 backend/logs
chmod 755 backend/uploads/images
```

---

## 📊 Format des Données

### 1. Produits (produit.csv)

| Colonne | Format | Exemple | Obligatoire |
|---------|--------|---------|------------|
| date_availability_produit | YYYY-MM-DD | 2024-01-15 | ❌ |
| nom | Texte | "Produit XYZ" | ✅ |
| reference | Texte unique | "T_01" | ✅ |
| prix_ttc | Nombre (virgule) | "19,99" | ✅ |
| taxe | Pourcentage | "11,65%" | ❌ |
| categorie | Texte | "Électronique" | ❌ |
| prix_achat | Nombre (virgule) | "12,50" | ❌ |

**Exemple CSV** :
```csv
date_availability_produit,nom,reference,prix_ttc,taxe,categorie,prix_achat
2024-01-15,Laptop,T_01,1299,11.65%,Informatique,800
2024-01-16,Souris,T_02,29.99,11.65%,Informatique,15
```

### 2. Détails Produits (detail-produit.csv)

| Colonne | Format | Exemple | Obligatoire |
|---------|--------|---------|------------|
| reference | Texte | "T_01" | ✅ |
| specificite | Texte | "Taille M" | ❌ |
| karazany | Texte | "Couleur Rouge" | ❌ |
| stock_initial | Entier | 100 | ✅ |
| prix_vente_ttc | Nombre (virgule) | "24,99" | ✅ |

**Exemple CSV** :
```csv
reference,specificite,karazany,stock_initial,prix_vente_ttc
T_01,Taille M,Couleur Noir,50,1299
T_01,Taille L,Couleur Noir,40,1299
T_02,Standard,Logitech,100,29.99
```

### 3. Clients (client.csv)

| Colonne | Format | Exemple | Obligatoire |
|---------|--------|---------|------------|
| date | YYYY-MM-DD | 2024-01-15 | ❌ |
| nom | Texte | "Jean Dupont" | ✅ |
| email | Email | "jean@example.com" | ✅ |
| pwd | Texte | "motdepasse123" | ❌ |
| adresse | Texte | "123 Rue de la Paix" | ❌ |
| achat | Complexe* | `[("T_01";3;"notes")]` | ❌ |
| etat | actif/inactif | "actif" | ❌ |

**Format du champ 'achat'** :
```
[("REFERENCE";QUANTITE;"REMARQUE"),...]

Exemples :
[("T_01";3;"urgent")]
[("T_01";3;""),("T_02";1;"autre entrepôt")]
```

**Exemple CSV** :
```csv
date,nom,email,pwd,adresse,achat,etat
2024-01-15,Jean Dupont,jean@example.com,pass123,123 Rue de la Paix,"[("T_01";3;"")]",actif
2024-01-16,Marie Martin,marie@example.com,pass456,456 Avenue Leclerc,"[("T_02";1;"urgent")]",actif
```

### 4. Images (images.zip)

Structure attendue dans le ZIP :

```
images.zip
├── T_01.jpg          # Référence T_01
├── T_01_1.jpg        # Variante 1 de T_01
├── T_01_2.png        # Variante 2 de T_01
└── T_02.jpg          # Référence T_02
```

**Convention de nommage** :
- Pas d'extension requise, mais recommandée (.jpg, .png, .gif, .webp)
- Le nom doit correspondre à une référence de produit
- Les fichiers `_1`, `_2`, etc. sont des variantes du même produit

---

## 🔄 Flux d'Import (Ordre Critique)

```
1️⃣ Produits
   └─ Crée les produits + catégories

2️⃣ Détails Produits
   └─ Crée les variantes/stocks
   └─ Référence le produit via FK

3️⃣ Clients (+ Commandes)
   └─ Crée les clients (email unique)
   └─ Crée les adresses
   └─ Crée les commandes et lignes

4️⃣ Images
   └─ Dézippe et sauvegarde
   └─ Référence les produits via FK
```

---

## 💻 Utilisation

### Méthode 1 : API HTTP (Frontend)

```javascript
// Vue.js / JavaScript
const formData = new FormData();
formData.append('produits', fileInput1.files[0]);
formData.append('details', fileInput2.files[0]);
formData.append('clients', fileInput3.files[0]);
formData.append('images', fileInput4.files[0]);

fetch('/backend/api/import.php', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => {
  console.log('Résumé:', data.summary);
  if (data.errors.length > 0) {
    console.warn('Erreurs:', data.errors);
  }
});
```

### Méthode 2 : Utilisation Programmée (PHP)

```php
<?php
require_once 'backend/config/database.php';
require_once 'backend/src/utils/Logger.php';
require_once 'backend/src/utils/CsvReader.php';
require_once 'backend/src/utils/Validator.php';
require_once 'backend/src/utils/DatabaseConnection.php';
require_once 'backend/src/services/ProduitImportService.php';
require_once 'backend/src/services/DetailProduitImportService.php';
require_once 'backend/src/services/ClientImportService.php';
require_once 'backend/src/services/ImageImportService.php';
require_once 'backend/src/controllers/ImportController.php';

Logger::init(LOG_FILE);

$controller = new ImportController();
$result = $controller->importAll([
    'produits' => '/path/to/produit.csv',
    'details' => '/path/to/detail-produit.csv',
    'clients' => '/path/to/client.csv',
    'images' => '/path/to/images.zip'
]);

if ($result['success']) {
    echo "✓ Import réussi\n";
    echo "Produits : " . $result['summary']['produits_importes'] . "\n";
} else {
    echo "✗ Erreurs : " . count($result['errors']) . "\n";
}
```

---

## 📝 Réponse de l'API

```json
{
  "success": true,
  "message": "Import terminé avec succès",
  "data": {
    "produits": {
      "success": true,
      "imported": 15,
      "errors": []
    },
    "details": {
      "success": true,
      "imported": 45,
      "errors": []
    },
    "clients": {
      "success": true,
      "imported": 8,
      "errors": []
    },
    "images": {
      "success": true,
      "imported": 23,
      "errors": []
    }
  },
  "summary": {
    "date_import": "2024-01-15 14:30:00",
    "produits_importes": 15,
    "details_importes": 45,
    "clients_importes": 8,
    "images_importees": 23,
    "total_erreurs": 0
  },
  "errors": []
}
```

---

## 🔍 Architecture Détaillée

### Classe : Logger

Gère tous les logs de l'application.

```php
Logger::init(LOG_FILE);           // Initialiser
Logger::log('Message');           // Info
Logger::error('Erreur');          // Erreur
Logger::warning('Attention');     // Avertissement
Logger::success('Succès');        // Succès
Logger::clear();                  // Vider le log
```

### Classe : CsvReader

Lire les fichiers CSV de manière sécurisée.

```php
$reader = new CsvReader('file.csv');
$data = $reader->read();          // Array d'arrays
$count = $reader->getRowCount();  // Nombre de lignes
```

### Classe : Validator

Valider et transformer les données.

```php
Validator::isValidEmail($email);
Validator::parsePrice('19,99');           // → 19.99
Validator::parsePercentage('11,65%');     // → 0.1165
Validator::parseOrderString($str);        // → Array
Validator::sanitizeString($str);          // Nettoyer
Validator::getFileExtension('file.jpg');  // → 'jpg'
```

### Classe : DatabaseConnection

Singleton pour gérer la connexion PDO.

```php
$db = DatabaseConnection::getInstance();
$rows = $db->query('SELECT * FROM produits WHERE prix > ?', [100]);
$row = $db->queryOne('SELECT * FROM clients WHERE email = ?', ['test@example.com']);
$id = $db->insert('produits', ['nom' => 'Test', 'prix' => 19.99]);
$db->update('produits', ['nom' => 'Nouveau'], 'id = ?', [1]);
$db->delete('produits', 'id = ?', [1]);

$db->beginTransaction();
// ...
$db->commit();
// ou $db->rollback();
```

### Services d'Import

Chaque service gère un type de données :

- **ProduitImportService** : Lire → Valider → Insérer produits + catégories
- **DetailProduitImportService** : Lire → Valider → Insérer détails
- **ClientImportService** : Lire → Valider → Insérer clients + adresses + commandes
- **ImageImportService** : Extraire ZIP → Valider → Sauvegarder + Insérer BD

Chaque service suit le pattern :

```
readCsvFile()
    ↓
validateData()
    ↓
insertData()
```

### ImportController

Orchestrateur qui coordonne tout.

```php
$controller = new ImportController();
$result = $controller->importAll([
    'produits' => '...',
    'details' => '...',
    'clients' => '...',
    'images' => '...'
]);
```

---

## 🛡️ Gestion des Erreurs

### Erreurs Bloquantes (arrêtent tout)
- Fichier introuvable
- Erreur de connexion BD
- Format de fichier invalide

### Erreurs Non-Bloquantes (par ligne)
- Données invalides (email, prix, etc.)
- Produit non trouvé pour variante
- Clé étrangère invalide

Les erreurs non-bloquantes sont enregistrées mais **n'arrêtent pas** l'import des autres lignes.

---

## 📋 Fichiers de Log

Format du fichier `/backend/logs/import.log` :

```
[2024-01-15 14:30:00] [INFO] Connexion à la base de données réussie
[2024-01-15 14:30:01] [INFO] === DÉBUT DE L'IMPORT GLOBAL ===
[2024-01-15 14:30:01] [INFO] --- Étape 1 : Import des produits ---
[2024-01-15 14:30:02] [INFO] Lecture du fichier produits : 15 produits trouvés
[2024-01-15 14:30:03] [LOG] Produit inséré : T_01
[2024-01-15 14:30:04] [SUCCESS] Import de 15 produits terminé
[2024-01-15 14:30:05] [INFO] --- Étape 2 : Import des détails produits ---
[2024-01-15 14:30:10] [SUCCESS] Import de 45 détails terminé
...
[2024-01-15 14:35:00] [INFO] === FIN DE L'IMPORT GLOBAL - SUCCÈS ===
```

---

## ⚙️ Configuration Avancée

Éditer `config/database.php` pour :

- Changer les limites de fichier
- Configurer les extensions autorisées
- Modifier les chemins de logs

```php
define('MAX_FILE_SIZE', 50 * 1024 * 1024);      // 50 MB
define('ALLOWED_CSV_EXTENSIONS', ['csv']);
define('ALLOWED_IMAGE_EXTENSIONS', ['jpg', 'jpeg', 'png']);
define('ALLOWED_ARCHIVE_EXTENSIONS', ['zip']);
```

---

## 🧪 Tests & Debugging

### Vérifier la Connexion BD

```php
try {
    $db = DatabaseConnection::getInstance();
    echo "✓ Connexion OK";
} catch (Exception $e) {
    echo "✗ Erreur : " . $e->getMessage();
}
```

### Lire les Logs

```bash
tail -f backend/logs/import.log
```

### Tester un Service Seul

```php
$service = new ProduitImportService();
$result = $service->importFromCsv('produit.csv');
var_dump($result);
```

---

## 💡 Bonnes Pratiques

✅ **À FAIRE** :
- Valider les fichiers avant upload
- Garder une copie de backup de la BD
- Vérifier les logs après import
- Tester en développement d'abord
- Encoder les fichiers en UTF-8

❌ **À ÉVITER** :
- Importer sans vérifier le format
- Modifier les fichiers pendant l'import
- Laisser de très gros fichiers (> 50MB)
- Ignorer les erreurs dans les logs
- Faire plusieurs imports en parallèle

---

## 🐛 Dépannage

| Problème | Solution |
|----------|----------|
| "Fichier CSV introuvable" | Vérifier le chemin absolu du fichier |
| "Erreur de connexion BD" | Vérifier les identifiants dans `config/database.php` |
| "Produit non trouvé" | Vérifier que la référence existe dans les produits |
| "Email invalide" | Vérifier le format de l'email dans le CSV |
| "Impossible d'insérer l'image" | Vérifier les droits d'accès du dossier `uploads/` |
| "Transactions échouées" | Vérifier les clés étrangères dans le schéma |

---

## 📚 Clean Code Principles

Cet code suit les principes du **Clean Code** :

1. **Noms explicites** : `importFromCsv()`, `validateProducts()`, pas `process()`, `do()`
2. **Petites fonctions** : Maximum 30 lignes par fonction
3. **Une responsabilité** : Un service = Un type de données
4. **DRY** : Pas de code dupliqué (réutiliser Validator, Logger)
5. **Erreurs gérées** : try/catch, logs détaillés
6. **Documentation** : Commentaires pour chaque classe et fonction
7. **Séparation des responsabilités** : Controller → Services → Utils → BD

---

## 📞 Support

En cas de problème :
1. Vérifier les logs dans `/backend/logs/import.log`
2. Valider le format des fichiers
3. Tester la connexion BD
4. Consulter la documentation USAGE_EXAMPLE.php

---

## 📜 Licence

Code exemple - Libre d'utilisation

---

**Créé pour un système pédagogique d'importation de données avec PHP pur**
