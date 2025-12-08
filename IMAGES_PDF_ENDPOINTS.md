# Documentation des Endpoints Images & PDF

## 📸 Gestion des Images de Robes

### 1. Upload d'images dans le storage

**Route:** `POST /dress-storage`
**API:** `DressesAPI.uploadImages(files: File[])`

Upload de fichiers dans le storage général (max 5 fichiers).

```typescript
import { DressesAPI } from "@/api/endpoints/dresses";

const files = [file1, file2, file3];
const uploadedImages = await DressesAPI.uploadImages(files);

// Réponse:
// [
//   { id: "uuid-1", name: "robe1.jpg", url: "https://bucket.com/org-id/dresses/uuid-1.jpg" },
//   { id: "uuid-2", name: "robe2.jpg", url: "https://bucket.com/org-id/dresses/uuid-2.jpg" }
// ]
```

**Format:**
- **Content-Type:** `multipart/form-data`
- **Body:** FormData avec champ `images` (plusieurs fichiers possibles)
- **Max:** 5 fichiers
- **Retour:** Liste d'objets `{ id, name, url }`

---

### 2. Ajouter des images à une robe existante

**Route:** `POST /dresses/:dressId/images`
**API:** `DressesAPI.addImages(dressId: string, files: File[])` ✨ **NOUVEAU**

Ajoute des images directement à une robe existante.

```typescript
import { DressesAPI } from "@/api/endpoints/dresses";

const dressId = "robe-uuid";
const files = [file1, file2];
const updatedDress = await DressesAPI.addImages(dressId, files);

// Réponse: DressDetails avec les nouvelles images ajoutées
// {
//   id: "robe-uuid",
//   name: "Robe cocktail",
//   images: [
//     "https://bucket.com/org-id/dresses/old-image.jpg",
//     "https://bucket.com/org-id/dresses/new-image-1.jpg",
//     "https://bucket.com/org-id/dresses/new-image-2.jpg"
//   ],
//   ...
// }
```

**Format:**
- **Content-Type:** `multipart/form-data`
- **Body:** FormData avec champ `images`
- **Retour:** Robe complète mise à jour (`DressDetails`)

---

### 3. Liste des images du storage

**Route:** `GET /dress-storage`

Liste toutes les images uploadées dans le storage.

```bash
curl -X GET http://localhost:3000/dress-storage \
  -H "Authorization: Bearer <token>"
```

---

### 4. Supprimer une image (storage)

**Route:** `DELETE /dress-storage/:filename`

Supprime un fichier du storage général.

```bash
curl -X DELETE http://localhost:3000/dress-storage/image.jpg \
  -H "Authorization: Bearer <token>"
```

**⚠️ Note:** Envoyer uniquement le **nom du fichier** (ex: `image.jpg`), pas l'URL complète.

---

### 5. Supprimer une image d'une robe

**Route:** `DELETE /dresses/:dressId/images`
**API:** `DressesAPI.deleteImage(dressId: string, imageId: string)`

Supprime une image spécifique d'une robe.

```typescript
import { DressesAPI } from "@/api/endpoints/dresses";

const dressId = "robe-uuid";
const imageId = "f48b273d-e41a-48a5-b2cf-30adcd0d96b9"; // Extrait de l'URL

const updatedDress = await DressesAPI.deleteImage(dressId, imageId);

// Réponse: Robe mise à jour sans l'image supprimée
```

**Body JSON:**
```json
{
  "key": "f48b273d-e41a-48a5-b2cf-30adcd0d96b9"
}
```

**Format:**
- **Content-Type:** `application/json`
- **Body:** `{ key: "filename.jpg" }`
- **Retour:** Robe mise à jour (`DressDetails`)

---

### 6. Supprimer plusieurs images d'une robe

**Route:** `DELETE /dresses/:dressId/images`
**API:** `DressesAPI.deleteImages(dressId: string, imageIds: string[])`

Supprime plusieurs images en une seule requête.

```typescript
import { DressesAPI } from "@/api/endpoints/dresses";

const dressId = "robe-uuid";
const imageIds = ["image-1.jpg", "image-2.jpg", "image-3.jpg"];

const updatedDress = await DressesAPI.deleteImages(dressId, imageIds);
```

**Body JSON:**
```json
{
  "keys": ["file1.jpg", "file2.jpg", "file3.jpg"]
}
```

**Format:**
- **Content-Type:** `application/json`
- **Body:** `{ keys: ["file1.jpg", "file2.jpg"] }`
- **Retour:** Robe mise à jour (`DressDetails`)

---

## 🔍 Extraction de l'ID d'une image

Pour supprimer une image, il faut extraire son nom/ID de l'URL complète:

```typescript
const extractStorageId = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.pathname.split("/").filter(Boolean).pop() ?? "";
  } catch {
    const parts = url.split("/");
    return parts.pop()?.split("?")[0] ?? "";
  }
};

// Exemple:
const url = "https://media-allure-creation.hel1.your-objectstorage.com/dresses/f48b273d.jpg";
const id = extractStorageId(url); // "f48b273d.jpg"
```

---

## 📄 Gestion des PDFs de Contrats

### 1. Générer un PDF de contrat

**Route:** `POST /contracts/:contractId/generate-pdf`
**API:** `ContractsAPI.generatePdf(contractId: string)`

Génère un PDF pour le contrat spécifié.

```typescript
import { ContractsAPI } from "@/api/endpoints/contracts";

const contractId = "contract-uuid";
const result = await ContractsAPI.generatePdf(contractId);

// Réponse:
// {
//   link: "https://bucket.com/org-id/contracts/contract-uuid.pdf"
// }
```

**Format:**
- **Method:** POST
- **Body:** Vide `{}`
- **Retour:** `{ link?: string }`

**Utilisation:**
```typescript
const { link } = await ContractsAPI.generatePdf(contractId);
if (link) {
  window.open(link, '_blank'); // Ouvrir le PDF
}
```

---

### 2. Upload d'un PDF signé

**Route:** `POST /contracts/:contractId/upload-signed-pdf`
**API:** `ContractsAPI.uploadSignedPdf(contractId: string, file: File)`

Upload d'un PDF signé par le client.

```typescript
import { ContractsAPI } from "@/api/endpoints/contracts";

const contractId = "contract-uuid";
const signedPdfFile = new File([blob], "contract-signed.pdf", { type: "application/pdf" });

const result = await ContractsAPI.uploadSignedPdf(contractId, signedPdfFile);

// Réponse:
// {
//   success: true,
//   link: "https://bucket.com/org-id/contracts/contract-uuid-signed.pdf",
//   data: { ...ContractFullView }
// }
```

**Format:**
- **Content-Type:** `multipart/form-data`
- **Body:** FormData avec champ `file` (un seul PDF)
- **Retour:** `{ success: boolean, link?: string, data?: ContractFullView }`

**Exemple complet:**
```typescript
// Upload du PDF signé
const fileInput = document.querySelector<HTMLInputElement>('#pdf-upload');
const file = fileInput?.files?.[0];

if (file && file.type === 'application/pdf') {
  try {
    const result = await ContractsAPI.uploadSignedPdf(contractId, file);

    if (result.success) {
      console.log("PDF uploadé:", result.link);
      console.log("Contrat mis à jour:", result.data);
    }
  } catch (error) {
    console.error("Erreur upload PDF:", error);
  }
}
```

---

## 🎯 Récapitulatif des Routes

### Images de Robes

| Action | Route | Méthode API | Body | Retour |
|--------|-------|-------------|------|--------|
| Upload storage | `POST /dress-storage` | `uploadImages(files)` | FormData `images` | `DressUploadFile[]` |
| Liste storage | `GET /dress-storage` | - | - | Liste fichiers |
| Delete storage | `DELETE /dress-storage/:filename` | - | - | - |
| **Ajouter à robe** | `POST /dresses/:id/images` | `addImages(id, files)` ✨ | FormData `images` | `DressDetails` |
| Supprimer 1 | `DELETE /dresses/:id/images` | `deleteImage(id, imageId)` | `{ key: "..." }` | `DressDetails` |
| Supprimer N | `DELETE /dresses/:id/images` | `deleteImages(id, imageIds)` | `{ keys: [...] }` | `DressDetails` |

### PDFs Contrats

| Action | Route | Méthode API | Body | Retour |
|--------|-------|-------------|------|--------|
| Générer PDF | `POST /contracts/:id/generate-pdf` | `generatePdf(id)` | `{}` | `{ link?: string }` |
| Upload signé | `POST /contracts/:id/upload-signed-pdf` | `uploadSignedPdf(id, file)` | FormData `file` | `{ success, link?, data? }` |

---

## 🔐 Authentification

**Toutes les routes nécessitent un JWT** dans le header `Authorization`:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Le backend ajoute automatiquement l'`organization_id` au path des fichiers:
```
Format final: https://bucket.com/{org-id}/dresses/{filename}.jpg
Format final: https://bucket.com/{org-id}/contracts/{filename}.pdf
```

---

## ✅ Changements Frontend

### Mis à jour

1. ✅ **`DressesAPI.addImages()`** - Nouvelle méthode ajoutée
2. ✅ **`httpClient.get()`** - Type corrigé pour accepter `CustomRequestInit`
3. ✅ Gestion d'erreur améliorée pour `/dresses/availability`

### Déjà en place

- ✅ `DressesAPI.uploadImages()` - Upload dans storage
- ✅ `DressesAPI.deleteImage()` - Suppression simple
- ✅ `DressesAPI.deleteImages()` - Suppression multiple
- ✅ `ContractsAPI.generatePdf()` - Génération PDF
- ✅ `ContractsAPI.uploadSignedPdf()` - Upload PDF signé

### Aucun changement requis

Les endpoints existants fonctionnent déjà correctement avec le backend! 🎉

---

## 📝 Exemples d'utilisation

### Workflow complet: Ajouter des images à une robe

```typescript
// 1. Sélectionner des fichiers
const fileInput = document.querySelector<HTMLInputElement>('#image-upload');
const files = Array.from(fileInput?.files || []);

// 2. Compresser les images (optionnel)
const compressedFiles = await compressImages(files, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920
});

// 3. Uploader dans le storage OU directement à la robe
// Option A: Upload dans storage puis ajouter à la robe
const uploadedImages = await DressesAPI.uploadImages(compressedFiles);
const imageUrls = uploadedImages.map(img => img.url);
await DressesAPI.update(dressId, { images: [...existingImages, ...imageUrls] });

// Option B: Ajouter directement à la robe (recommandé)
const updatedDress = await DressesAPI.addImages(dressId, compressedFiles);
console.log("Nouvelles images:", updatedDress.images);
```

### Workflow complet: PDF de contrat

```typescript
// 1. Générer le PDF
const { link } = await ContractsAPI.generatePdf(contractId);

// 2. Télécharger ou afficher
if (link) {
  // Ouvrir dans nouvel onglet
  window.open(link, '_blank');

  // OU télécharger
  const a = document.createElement('a');
  a.href = link;
  a.download = `contrat-${contractId}.pdf`;
  a.click();
}

// 3. Client signe le PDF offline

// 4. Upload du PDF signé
const signedFile = /* File obtenu depuis input */;
const result = await ContractsAPI.uploadSignedPdf(contractId, signedFile);

if (result.success) {
  console.log("PDF signé uploadé:", result.link);
  console.log("Contrat mis à jour:", result.data);
}
```

---

## 🚨 Points d'attention

### Images

1. **Nom du fichier uniquement** pour les suppressions (pas l'URL complète)
2. **Max 5 fichiers** par upload dans `/dress-storage`
3. **Organisation ID** ajouté automatiquement par le backend
4. **Compression recommandée** avant upload (utiliser `compressImages()`)

### PDFs

1. **Format PDF uniquement** pour les uploads signés
2. **Vérifier `result.success`** avant d'utiliser le lien
3. **JWT requis** pour toutes les opérations

---

## 📚 Ressources

- **API Dresses:** `src/api/endpoints/dresses.ts`
- **API Contracts:** `src/api/endpoints/contracts.ts`
- **HTTP Client:** `src/api/httpClient.ts`
- **Compression images:** `src/utils/imageCompression.ts`
