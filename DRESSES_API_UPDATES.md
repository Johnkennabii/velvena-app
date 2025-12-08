# Mises à jour de l'API Dresses

## Date: 2025-12-07

### Changements apportés à `src/api/endpoints/dresses.ts`

#### 1. Nouveau type `DressCreateFormDataPayload`

Ajout d'un type pour supporter la création de robes via `multipart/form-data`:

```typescript
export type DressCreateFormDataPayload = {
  name: string;
  reference: string;
  price_ht: number;
  price_ttc: number;
  price_per_day_ht?: number | null;
  price_per_day_ttc?: number | null;
  type_id: string;
  size_id: string;
  condition_id: string;
  color_id?: string | null;
  images?: File[] | string[];
};
```

#### 2. Nouvelle méthode `createWithFormData()`

Permet de créer une robe avec des fichiers images directement:

```typescript
async createWithFormData(payload: DressCreateFormDataPayload): Promise<DressDetails>
```

**Exemple d'utilisation:**

```typescript
import { DressesAPI } from "@/api/endpoints/dresses";

// Création avec images (File[])
const newDress = await DressesAPI.createWithFormData({
  name: "Elegant Evening Gown",
  reference: "EVG12345",
  price_ht: 150,
  price_ttc: 180,
  price_per_day_ht: 15,
  price_per_day_ttc: 18,
  type_id: "8ce2c02b-b966-4a87-bc8f-481a17cb3dd9",
  size_id: "7c64fae6-6027-4a64-9415-40ba963c2d41",
  condition_id: "27ab5094-c422-45b8-bdbc-fc8d231c94dc",
  color_id: "8615758a-8a26-4882-90a4-47c106dce871",
  images: [fileObject1, fileObject2], // File[] ou string[]
});
```

#### 3. Support des dates dans `listDetails()`

Ajout des paramètres `startDate` et `endDate` pour filtrer les robes par disponibilité:

```typescript
type DressDetailsListParams = {
  // ... autres paramètres
  startDate?: string;
  endDate?: string;
};
```

**Exemple d'utilisation:**

```typescript
// Filtrer par couleur et dates
const dresses = await DressesAPI.listDetails({
  page: 1,
  limit: 10,
  colors: "6a6405a7-3c98-40c0-a1f6-088ce8dc7eb7",
  startDate: "2025-01-01T00:00:00.000Z",
  endDate: "2025-12-31T23:59:59.000Z",
});
```

### Correspondance avec les endpoints backend

#### ✅ GET `/dresses?limit=50&offset=0`
- Retourne: `{success: true, data: [], total: 0}`
- **Déjà géré** par `extractArray()` et `normalizeListResponse()`

#### ✅ POST `/dresses` (multipart/form-data)
- **Nouvelle méthode** `createWithFormData()` pour supporter ce format
- Supporte les images en tant que `File[]` ou `string[]`

#### ✅ PUT `/dresses/:id` (application/json)
- **Déjà géré** par la méthode `update()`
- Accepte `DressUpdatePayload`

#### ✅ GET `/dresses/details-view` avec filtres
- **Mis à jour** pour supporter `startDate` et `endDate`
- Retourne les robes avec leurs relations (type, size, color, condition)

### Notes importantes

1. **Format des réponses**: Toutes les réponses du backend suivent le format:
   ```json
   {
     "success": true,
     "data": [...],
     "total": 0
   }
   ```
   Ce format est correctement géré par `extractArray()`.

2. **Images**:
   - Retournées comme `string[]` (URLs)
   - Peuvent être vides: `"images": []`

3. **Prix**:
   - Retournés comme strings par le backend: `"price_ht": "150"`
   - Le frontend les normalise en nombres via `normalizeDress()`

4. **Relations**:
   - Le backend peut retourner les objets complets (type, size, color, condition)
   - Le frontend normalise les deux formats (IDs seuls ou objets complets)

### Migration

Si vous utilisez actuellement `create()` et voulez supporter l'upload d'images:

**Avant:**
```typescript
// 1. Upload images séparément
const uploadedImages = await DressesAPI.uploadImages(files);

// 2. Créer la robe avec les URLs
await DressesAPI.create({
  ...payload,
  images: uploadedImages.map(img => img.url),
});
```

**Après:**
```typescript
// En une seule étape
await DressesAPI.createWithFormData({
  ...payload,
  images: files, // File[] directement
});
```

### Tests effectués

✅ GET `/dresses` - Liste vide retournée correctement
✅ POST `/dresses` - Création avec multipart/form-data
✅ PUT `/dresses/:id` - Mise à jour JSON
✅ GET `/dresses/details-view` - Filtres avec dates et couleurs

Tous les endpoints sont maintenant alignés avec les réponses du backend.
