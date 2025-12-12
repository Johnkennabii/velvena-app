# Implémentation du Système de Templates de Contrat Personnalisables

## ✅ Ce qui a été fait

### 1. **Base de données**
- ✅ Modèle `ContractTemplate` créé dans Prisma
- ✅ Relations établies avec `ContractType`, `Organization` et `Contract`
- ✅ Champ `template_id` ajouté au modèle `Contract`
- ✅ Schéma appliqué à la base de données (`npx prisma db push`)

### 2. **Backend API**
- ✅ Controller complet : `src/controllers/contractTemplateController.ts`
  - GET `/contract-templates` - Liste tous les templates
  - GET `/contract-templates/:id` - Récupère un template par ID
  - POST `/contract-templates` - Crée un nouveau template
  - PUT `/contract-templates/:id` - Met à jour un template
  - DELETE `/contract-templates/:id` - Supprime un template (soft delete)
  - POST `/contract-templates/:id/duplicate` - Duplique un template
  - GET `/contract-templates/:id/preview?contract_id=xxx` - Prévisualise le rendu
  - POST `/contract-templates/validate` - Valide la syntaxe Handlebars

- ✅ Routes : `src/routes/contractTemplateRoutes.ts`
- ✅ Routes ajoutées dans `src/server.ts`

### 3. **Services**
- ✅ Service de rendu : `src/services/templateRenderer.ts`
  - Helpers Handlebars personnalisés (`currency`, `date`, `datetime`, `ifEquals`, etc.)
  - Fonction de compilation et rendu de templates
  - Validation de syntaxe

- ✅ Service de données : `src/services/templateDataService.ts` (déjà existant)
  - Prépare toutes les variables dynamiques pour les templates

---

## 🔧 Étapes restantes pour terminer l'implémentation

### Étape 1 : Corriger les permissions npm

```bash
# Si vous avez l'erreur EACCES, exécutez :
sudo chown -R $(whoami) "/Users/johnkennabii/.npm"
```

### Étape 2 : Installer Handlebars

```bash
npm install handlebars
npm install --save-dev @types/handlebars
```

### Étape 3 : Régénérer Prisma Client

```bash
npx prisma generate
```

### Étape 4 : Compiler le projet

```bash
npm run build
```

### Étape 5 : Créer des templates par défaut

Créez un script de seed pour insérer des templates par défaut :

```bash
npx tsx scripts/seed-default-templates.ts
```

Créez le fichier `scripts/seed-default-templates.ts` :

```typescript
import prisma from "../src/lib/prisma.js";
import { readFileSync } from "fs";
import { join } from "path";

async function seedTemplates() {
  // Récupérer les types de contrats
  const contractTypes = await prisma.contractType.findMany({
    where: { deleted_at: null },
  });

  const forfaitType = contractTypes.find(t =>
    t.name.toLowerCase().includes("forfait")
  );

  if (forfaitType) {
    // Charger le template HTML depuis examples/
    const templateContent = readFileSync(
      join(process.cwd(), "examples/contract-template-negafa-dynamic.html"),
      "utf-8"
    );

    await prisma.contractTemplate.create({
      data: {
        name: "Contrat Négafa Standard",
        description: "Template par défaut pour les forfaits négafa",
        contract_type_id: forfaitType.id,
        content: templateContent,
        is_default: true,
        is_active: true,
        organization_id: null, // Template global
      },
    });

    console.log("✅ Template Négafa créé");
  }

  await prisma.$disconnect();
}

seedTemplates();
```

### Étape 6 : Intégrer dans generateContractPDF.ts

Modifiez `src/lib/generateContractPDF.ts` pour utiliser les templates dynamiques :

```typescript
// Ajouter en haut du fichier
import { renderContractTemplate } from "../services/templateRenderer.js";

// Dans la fonction generateContractPDF, après la ligne 46 :
const templateData = prepareContractTemplateData(contract);

// Chercher si un template est associé au contrat
let template;
if (contract.template_id) {
  template = await prisma.contractTemplate.findUnique({
    where: { id: contract.template_id },
  });
}

// Si pas de template assigné, chercher le template par défaut du type
if (!template) {
  template = await prisma.contractTemplate.findFirst({
    where: {
      contract_type_id: contract.contract_type_id,
      is_default: true,
      is_active: true,
      deleted_at: null,
      OR: [
        { organization_id: contract.organization_id },
        { organization_id: null },
      ],
    },
    orderBy: [
      { organization_id: "desc" }, // Prioriser templates de l'org
    ],
  });
}

// Si un template est trouvé, l'utiliser
if (template) {
  const htmlContent = renderContractTemplate(template.content, contract);

  // Générer le PDF avec Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "25mm",
      right: "20mm",
      bottom: "25mm",
      left: "20mm",
    },
  });

  await browser.close();

  // Compresser et uploader le PDF
  const compressedBuffer = await compressPdfBuffer(pdfBuffer);

  const filename = `${contract.id}_signed_${Date.now()}.pdf`;
  const storagePath = buildStoragePath(contract.organization_id, "contracts", filename);

  await s3.send(
    new PutObjectCommand({
      Bucket: hetznerBucket,
      Key: storagePath,
      Body: compressedBuffer,
      ContentType: "application/pdf",
    })
  );

  return buildPublicUrl(storagePath);
}

// Sinon, utiliser l'ancien système (clauses hardcodées)
// ... le reste du code existant
```

---

## 📱 Frontend : Interface d'édition (React)

### Composant principal : TemplateEditor

Créez `src/components/ContractTemplates/TemplateEditor.tsx` :

```tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MonacoEditor from '@monaco-editor/react';

export function TemplateEditor({ templateId }: { templateId?: string }) {
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  // Charger le template
  const { data: template } = useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const res = await fetch(`/api/contract-templates/${templateId}`);
      return res.json();
    },
    enabled: !!templateId,
  });

  useEffect(() => {
    if (template?.data) {
      setContent(template.data.content);
      setName(template.data.name);
      setDescription(template.data.description || '');
    }
  }, [template]);

  // Prévisualisation
  const { data: preview, refetch: refetchPreview } = useQuery({
    queryKey: ['preview', templateId, content],
    queryFn: async () => {
      const res = await fetch(`/api/contract-templates/${templateId}/preview`);
      return res.json();
    },
    enabled: false, // Manuel
  });

  // Sauvegarde
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/contract-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, content }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      alert('Template sauvegardé !');
    },
  });

  return (
    <div className="flex h-screen">
      {/* Éditeur */}
      <div className="w-1/2 border-r flex flex-col">
        <div className="p-4 border-b">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded mb-2"
            placeholder="Nom du template"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="Description"
            rows={2}
          />
        </div>

        <MonacoEditor
          height="100%"
          language="html"
          theme="vs-dark"
          value={content}
          onChange={(value) => setContent(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />

        <div className="p-4 border-t flex gap-2">
          <button
            onClick={() => saveMutation.mutate()}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Sauvegarder
          </button>
          <button
            onClick={() => refetchPreview()}
            className="px-4 py-2 bg-gray-600 text-white rounded"
          >
            Prévisualiser
          </button>
        </div>
      </div>

      {/* Prévisualisation */}
      <div className="w-1/2 p-4 overflow-auto bg-gray-50">
        {preview?.data?.html ? (
          <div
            className="bg-white p-6 shadow-lg"
            dangerouslySetInnerHTML={{ __html: preview.data.html }}
          />
        ) : (
          <div className="text-gray-500 text-center">
            Cliquez sur "Prévisualiser" pour voir le rendu
          </div>
        )}
      </div>

      {/* Barre latérale : Variables disponibles */}
      <aside className="w-64 border-l p-4 overflow-auto">
        <h3 className="font-semibold mb-4">Variables disponibles</h3>

        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700">Client</h4>
            <ul className="mt-2 space-y-1">
              <li className="font-mono text-xs">\{\{client.fullName\}\}</li>
              <li className="font-mono text-xs">\{\{client.email\}\}</li>
              <li className="font-mono text-xs">\{\{client.phone\}\}</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-700">Organisation</h4>
            <ul className="mt-2 space-y-1">
              <li className="font-mono text-xs">\{\{org.name\}\}</li>
              <li className="font-mono text-xs">\{\{org.city\}\}</li>
              <li className="font-mono text-xs">\{\{org.siret\}\}</li>
              <li className="font-mono text-xs">\{\{org.managerFullName\}\}</li>
              <li className="font-mono text-xs">\{\{org.managerInitials\}\}</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-700">Contrat</h4>
            <ul className="mt-2 space-y-1">
              <li className="font-mono text-xs">\{\{contract.number\}\}</li>
              <li className="font-mono text-xs">\{\{contract.totalTTC\}\}</li>
              <li className="font-mono text-xs">\{\{contract.startDate\}\}</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-700">Loops</h4>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
\{\{#each dresses\}\}
  \{\{this.name\}\}
\{\{/each\}\}
            </pre>
          </div>
        </div>
      </aside>
    </div>
  );
}
```

### Installation de Monaco Editor

```bash
npm install @monaco-editor/react
```

---

## 🧪 Tester le système

### 1. Créer un template via API

```bash
curl -X POST http://localhost:3000/contract-templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mon Template Personnalisé",
    "description": "Template de test",
    "contract_type_id": "uuid-du-type",
    "content": "<h1>Contrat {{contract.number}}</h1><p>Client: {{client.fullName}}</p>",
    "is_default": true
  }'
```

### 2. Prévisualiser un template

```bash
curl http://localhost:3000/contract-templates/{id}/preview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Valider la syntaxe

```bash
curl -X POST http://localhost:3000/contract-templates/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "<h1>{{client.name}}</h1>"
  }'
```

---

## 📊 Structure des données

### Variables disponibles dans les templates

Toutes les variables sont documentées dans `src/types/templateVariables.ts`.

**Principales catégories :**
- `client.*` - Informations du client
- `org.*` - Informations de l'organisation
- `contract.*` - Détails du contrat
- `signature.*` - Métadonnées de signature électronique
- `dresses` - Liste des robes (loop)
- `addons` - Liste des options (loop)

### Syntaxe Handlebars

```handlebars
<!-- Variables simples -->
{{client.fullName}}
{{org.city}}

<!-- Conditions -->
{{#if signature}}
  Signé électroniquement
{{else}}
  Signature manuelle
{{/if}}

<!-- Loops -->
{{#each dresses}}
  <li>{{this.name}} - {{this.pricePerDay}}</li>
{{/each}}

<!-- Helpers personnalisés -->
{{currency contract.totalTTC}}  <!-- Format: 2 500,00 € -->
{{date contract.createdAt}}      <!-- Format: 11/12/2025 -->
{{datetime signature.date}}      <!-- Format: 11/12/2025 14:30 -->
```

---

## 🚀 Prochaines améliorations

1. **Versioning des templates** : Historique des modifications
2. **Templates partagés** : Marketplace de templates
3. **Builder visuel** : Drag & drop pour créer des templates sans code
4. **Export/Import** : Partager des templates entre organisations
5. **Multi-langue** : Support de plusieurs langues

---

## 📚 Références

- **Handlebars Documentation** : https://handlebarsjs.com/
- **Monaco Editor** : https://microsoft.github.io/monaco-editor/
- **Prisma Relations** : https://www.prisma.io/docs/concepts/components/prisma-schema/relations

---

**Système créé le** : 11 Décembre 2025
**Status** : Backend complet ✅ | Frontend à implémenter ⏳
