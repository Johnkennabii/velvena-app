/**
 * Templates de départ prédéfinis - Design moderne et professionnel
 * Créés par un expert UI/UX pour une expérience utilisateur optimale
 */

export const STARTER_TEMPLATES = [
  {
    id: "blank",
    name: "Template vide",
    description: "Commencer de zéro avec une base HTML simple",
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrat {{contract.number}}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 40px;
      color: #1f2937;
      background: #ffffff;
    }
  </style>
</head>
<body>
  <h1>Mon contrat</h1>
  <p>Votre contenu ici...</p>
</body>
</html>`,
  },

  {
    id: "elegant-minimal",
    name: "✨ Élégant Minimaliste",
    description: "Design épuré et sophistiqué avec typographie moderne",
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrat {{contract.number}}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.8;
      color: #1a1a1a;
      background: #ffffff;
    }

    .page {
      max-width: 800px;
      margin: 0 auto;
      padding: 60px 80px;
    }

    /* Header élégant */
    .header {
      text-align: center;
      padding-bottom: 50px;
      border-bottom: 1px solid #e5e5e5;
      margin-bottom: 50px;
    }

    .header h1 {
      font-size: 32px;
      font-weight: 300;
      letter-spacing: -0.5px;
      color: #1a1a1a;
      margin-bottom: 8px;
    }

    .header .contract-number {
      font-size: 14px;
      font-weight: 500;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Sections */
    .section {
      margin-bottom: 45px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #1a1a1a;
      letter-spacing: -0.3px;
    }

    /* Grille d'informations */
    .info-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 12px 30px;
      font-size: 14px;
    }

    .info-label {
      font-weight: 500;
      color: #666;
    }

    .info-value {
      color: #1a1a1a;
    }

    /* Tableau moderne */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      font-size: 14px;
    }

    thead {
      background: #fafafa;
    }

    th {
      padding: 14px 16px;
      text-align: left;
      font-weight: 600;
      color: #1a1a1a;
      border-bottom: 2px solid #e5e5e5;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
      color: #1a1a1a;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    tbody tr:hover {
      background: #fafafa;
    }

    /* Totaux */
    .totals {
      margin-top: 30px;
      padding: 25px;
      background: #fafafa;
      border-radius: 4px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 15px;
    }

    .totals-row.final {
      padding-top: 20px;
      margin-top: 15px;
      border-top: 2px solid #1a1a1a;
      font-size: 20px;
      font-weight: 600;
    }

    /* Zone de signature */
    .signature-area {
      margin-top: 60px;
      padding-top: 40px;
      border-top: 1px solid #e5e5e5;
    }

    .signature-box {
      margin-top: 50px;
      text-align: center;
      padding: 40px;
      border: 2px dashed #d0d0d0;
      border-radius: 4px;
    }

    .signature-label {
      font-size: 13px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 40px;
    }

    /* Footer */
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      font-size: 12px;
      color: #999;
      line-height: 1.6;
    }

    .footer strong {
      color: #666;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- En-tête -->
    <div class="header">
      <h1>Contrat de Location</h1>
      <div class="contract-number">N° {{contract.number}}</div>
    </div>

    <!-- Informations client -->
    <div class="section">
      <h2 class="section-title">Informations Client</h2>
      <div class="info-grid">
        <div class="info-label">Nom complet</div>
        <div class="info-value">{{client.fullName}}</div>

        <div class="info-label">Email</div>
        <div class="info-value">{{client.email}}</div>

        <div class="info-label">Téléphone</div>
        <div class="info-value">{{client.phone}}</div>

        <div class="info-label">Adresse</div>
        <div class="info-value">{{client.address}}, {{client.zipCode}} {{client.city}}</div>
      </div>
    </div>

    <!-- Période -->
    <div class="section">
      <h2 class="section-title">Période de Location</h2>
      <div class="info-grid">
        <div class="info-label">Date de début</div>
        <div class="info-value">{{date contract.startDate}}</div>

        <div class="info-label">Date de fin</div>
        <div class="info-value">{{date contract.endDate}}</div>
      </div>
    </div>

    <!-- Prestations -->
    <div class="section">
      <h2 class="section-title">Détail des Prestations</h2>

      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th style="text-align: center;">Qté</th>
            <th style="text-align: right;">Prix Unit.</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          {{#each dresses}}
          <tr>
            <td>
              <strong>{{this.name}}</strong><br>
              <small style="color: #999;">{{this.reference}}</small>
            </td>
            <td style="text-align: center;">{{this.quantity}}</td>
            <td style="text-align: right;">{{currency this.pricePerDay}}</td>
            <td style="text-align: right;"><strong>{{currency this.subtotal}}</strong></td>
          </tr>
          {{/each}}
          {{#each addons}}
          <tr>
            <td>
              <strong>{{this.name}}</strong><br>
              <small style="color: #999;">Option</small>
            </td>
            <td style="text-align: center;">{{this.quantity}}</td>
            <td style="text-align: right;">{{currency this.price}}</td>
            <td style="text-align: right;"><strong>{{currency this.subtotal}}</strong></td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Total HT</span>
          <span>{{currency contract.totalHT}}</span>
        </div>
        <div class="totals-row final">
          <span>Total TTC</span>
          <span>{{currency contract.totalTTC}}</span>
        </div>
        <div class="totals-row">
          <span style="color: #666;">Acompte versé</span>
          <span>{{currency contract.totalDeposit}}</span>
        </div>
      </div>
    </div>

    <!-- Signature -->
    <div class="signature-area">
      {{#if signature}}
      <div style="text-align: center; padding: 30px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 4px;">
        <div style="color: #166534; font-weight: 500;">✓ Signé électroniquement</div>
        <div style="color: #166534; font-size: 13px; margin-top: 8px;">{{datetime signature.date}}</div>
      </div>
      {{else}}
      <div class="signature-box">
        <div class="signature-label">Signature du client</div>
        <div style="margin-top: 30px; color: #666;">Date : _______________</div>
      </div>
      {{/if}}
    </div>

    <!-- Footer -->
    <div class="footer">
      <strong>{{org.name}}</strong><br>
      {{org.address}}, {{org.city}}<br>
      SIRET : {{org.siret}} · Tél : {{org.phone}}<br>
      {{org.email}}
    </div>
  </div>
</body>
</html>`,
  },

  {
    id: "luxury-gold",
    name: "👑 Luxe & Prestige",
    description: "Template premium avec accents dorés et typographie raffinée",
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrat {{contract.number}}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Lato', sans-serif;
      line-height: 1.7;
      color: #2c2c2c;
      background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%);
    }

    .page {
      max-width: 850px;
      margin: 0 auto;
      padding: 0;
      background: white;
      box-shadow: 0 0 60px rgba(0,0,0,0.08);
    }

    /* Header luxueux */
    .header {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      padding: 50px 60px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, #d4af37, transparent);
    }

    .header h1 {
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }

    .header .contract-number {
      font-size: 13px;
      color: #d4af37;
      text-transform: uppercase;
      letter-spacing: 3px;
      font-weight: 400;
    }

    .content {
      padding: 50px 60px;
    }

    /* Sections */
    .section {
      margin-bottom: 40px;
    }

    .section-title {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 25px;
      padding-bottom: 12px;
      border-bottom: 2px solid #d4af37;
      position: relative;
    }

    .section-title::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 60px;
      height: 2px;
      background: #1a1a1a;
    }

    /* Grille d'informations élégante */
    .info-grid {
      background: #fafafa;
      padding: 25px;
      border-left: 4px solid #d4af37;
      border-radius: 2px;
    }

    .info-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid #efefef;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      width: 150px;
      font-weight: 600;
      color: #666;
      font-size: 14px;
    }

    .info-value {
      flex: 1;
      color: #1a1a1a;
      font-size: 15px;
    }

    /* Tableau premium */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    thead {
      background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
      color: white;
    }

    th {
      padding: 18px 20px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-right: 1px solid rgba(255,255,255,0.1);
    }

    th:last-child {
      border-right: none;
    }

    td {
      padding: 20px;
      border-bottom: 1px solid #f0f0f0;
      color: #2c2c2c;
    }

    tbody tr {
      transition: all 0.2s;
    }

    tbody tr:hover {
      background: #fafafa;
      transform: translateX(2px);
    }

    /* Totaux luxueux */
    .totals-section {
      margin-top: 40px;
      background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
      padding: 35px;
      border-radius: 4px;
      border: 1px solid #e8e8e8;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 16px;
      color: #2c2c2c;
    }

    .totals-row.final {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #d4af37;
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
    }

    .totals-row.final .value {
      color: #d4af37;
    }

    /* Signature premium */
    .signature-section {
      margin-top: 60px;
      padding: 40px;
      background: #fafafa;
      border: 2px solid #e8e8e8;
      border-radius: 4px;
      text-align: center;
    }

    .signature-title {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      color: #1a1a1a;
      margin-bottom: 30px;
    }

    .signature-box {
      margin: 40px auto 0;
      max-width: 400px;
      padding: 40px;
      border: 2px dashed #d4af37;
      border-radius: 4px;
    }

    /* Footer élégant */
    .footer {
      background: #1a1a1a;
      padding: 40px 60px;
      text-align: center;
      color: #999;
      font-size: 13px;
      line-height: 1.8;
    }

    .footer .org-name {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      color: #d4af37;
      margin-bottom: 15px;
      font-weight: 600;
    }

    .footer .separator {
      color: #d4af37;
      margin: 0 8px;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <h1>Contrat de Location</h1>
      <div class="contract-number">N° {{contract.number}}</div>
    </div>

    <!-- Contenu -->
    <div class="content">
      <!-- Client -->
      <div class="section">
        <h2 class="section-title">Informations Client</h2>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-label">Nom complet</div>
            <div class="info-value">{{client.fullName}}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Email</div>
            <div class="info-value">{{client.email}}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Téléphone</div>
            <div class="info-value">{{client.phone}}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Adresse</div>
            <div class="info-value">{{client.address}}, {{client.zipCode}} {{client.city}}</div>
          </div>
        </div>
      </div>

      <!-- Période -->
      <div class="section">
        <h2 class="section-title">Période de Location</h2>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-label">Du</div>
            <div class="info-value">{{date contract.startDate}}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Au</div>
            <div class="info-value">{{date contract.endDate}}</div>
          </div>
        </div>
      </div>

      <!-- Prestations -->
      <div class="section">
        <h2 class="section-title">Détail des Prestations</h2>

        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th style="text-align: center; width: 80px;">Qté</th>
              <th style="text-align: right; width: 150px;">Prix Unitaire</th>
              <th style="text-align: right; width: 150px;">Total</th>
            </tr>
          </thead>
          <tbody>
            {{#each dresses}}
            <tr>
              <td>
                <strong style="font-size: 15px;">{{this.name}}</strong><br>
                <small style="color: #999;">Réf: {{this.reference}}</small>
              </td>
              <td style="text-align: center;">{{this.quantity}}</td>
              <td style="text-align: right;">{{currency this.pricePerDay}}</td>
              <td style="text-align: right;"><strong>{{currency this.subtotal}}</strong></td>
            </tr>
            {{/each}}
            {{#each addons}}
            <tr>
              <td>
                <strong style="font-size: 15px;">{{this.name}}</strong><br>
                <small style="color: #999;">Option supplémentaire</small>
              </td>
              <td style="text-align: center;">{{this.quantity}}</td>
              <td style="text-align: right;">{{currency this.price}}</td>
              <td style="text-align: right;"><strong>{{currency this.subtotal}}</strong></td>
            </tr>
            {{/each}}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-row">
            <span>Total Hors Taxes</span>
            <span>{{currency contract.totalHT}}</span>
          </div>
          <div class="totals-row final">
            <span>Total TTC</span>
            <span class="value">{{currency contract.totalTTC}}</span>
          </div>
          <div class="totals-row" style="font-size: 14px; color: #666; margin-top: 15px;">
            <span>Acompte versé</span>
            <span>{{currency contract.totalDeposit}}</span>
          </div>
        </div>
      </div>

      <!-- Signature -->
      <div class="signature-section">
        <div class="signature-title">Signature</div>
        {{#if signature}}
        <div style="padding: 25px; background: #e8f5e9; border: 2px solid #4caf50; border-radius: 4px;">
          <div style="color: #2e7d32; font-weight: 600; font-size: 16px;">✓ Signé électroniquement</div>
          <div style="color: #2e7d32; margin-top: 8px;">{{datetime signature.date}}</div>
        </div>
        {{else}}
        <div class="signature-box">
          <div style="color: #999; margin-bottom: 50px;">Signature du client</div>
          <div style="color: #666;">Date : _______________</div>
        </div>
        {{/if}}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="org-name">{{org.name}}</div>
      <div>
        {{org.address}}, {{org.city}}
      </div>
      <div style="margin-top: 10px;">
        SIRET : {{org.siret}} <span class="separator">·</span> Tél : {{org.phone}} <span class="separator">·</span> {{org.email}}
      </div>
    </div>
  </div>
</body>
</html>`,
  },

  {
    id: "modern-colorful",
    name: "🎨 Moderne & Coloré",
    description: "Design vibrant avec dégradés et interface moderne",
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrat {{contract.number}}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Poppins', sans-serif;
      line-height: 1.7;
      color: #1f2937;
      background: #f8fafc;
    }

    .page {
      max-width: 900px;
      margin: 40px auto;
      background: white;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      border-radius: 12px;
      overflow: hidden;
    }

    /* Header avec dégradé */
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      padding: 60px 50px;
      text-align: center;
      position: relative;
    }

    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(255,255,255,0.1)" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,106.7C960,117,1056,139,1152,133.3C1248,128,1344,96,1392,80L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>') no-repeat bottom;
      background-size: cover;
    }

    .header h1 {
      font-size: 38px;
      font-weight: 700;
      color: white;
      margin-bottom: 12px;
      position: relative;
      z-index: 1;
    }

    .header .contract-number {
      font-size: 14px;
      color: rgba(255,255,255,0.9);
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 500;
      position: relative;
      z-index: 1;
      background: rgba(255,255,255,0.2);
      padding: 8px 20px;
      border-radius: 20px;
      display: inline-block;
    }

    .content {
      padding: 50px;
    }

    /* Sections avec icônes */
    .section {
      margin-bottom: 40px;
    }

    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 25px;
    }

    .section-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      margin-right: 15px;
    }

    .section-title {
      font-size: 22px;
      font-weight: 600;
      color: #1f2937;
    }

    /* Cards pour les infos */
    .info-card {
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    .info-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      width: 140px;
      font-weight: 500;
      color: #6b7280;
      font-size: 14px;
    }

    .info-value {
      flex: 1;
      color: #1f2937;
      font-size: 15px;
      font-weight: 500;
    }

    /* Tableau moderne */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    thead {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    th {
      padding: 16px;
      text-align: left;
      font-weight: 600;
      color: white;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 18px 16px;
      border-bottom: 1px solid #f3f4f6;
      color: #1f2937;
      font-size: 14px;
    }

    tbody tr {
      transition: all 0.2s;
      background: white;
    }

    tbody tr:hover {
      background: #f8fafc;
      transform: scale(1.01);
    }

    /* Totaux avec style cards */
    .totals-section {
      margin-top: 35px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px solid #bae6fd;
      border-radius: 12px;
      padding: 30px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 16px;
      color: #1f2937;
    }

    .totals-row.final {
      margin-top: 20px;
      padding-top: 20px;
      padding: 25px;
      margin: 20px -30px -30px -30px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      font-size: 26px;
      font-weight: 700;
      border-radius: 0 0 10px 10px;
    }

    /* Signature moderne */
    .signature-section {
      margin-top: 50px;
      padding: 35px;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #fcd34d;
      border-radius: 12px;
    }

    .signature-title {
      font-size: 20px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 25px;
      text-align: center;
    }

    .signature-box {
      background: white;
      padding: 40px;
      border: 3px dashed #fcd34d;
      border-radius: 12px;
      text-align: center;
    }

    /* Footer dégradé */
    .footer {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      padding: 40px 50px;
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
      line-height: 1.8;
    }

    .footer .org-name {
      font-size: 22px;
      color: white;
      margin-bottom: 15px;
      font-weight: 600;
    }

    .footer .divider {
      color: #667eea;
      margin: 0 10px;
    }

    /* Badge */
    .badge {
      display: inline-block;
      padding: 6px 12px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <h1>Contrat de Location</h1>
      <div class="contract-number">N° {{contract.number}}</div>
    </div>

    <!-- Contenu -->
    <div class="content">
      <!-- Client -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">👤</div>
          <h2 class="section-title">Informations Client</h2>
        </div>
        <div class="info-card">
          <div class="info-row">
            <div class="info-label">Nom complet</div>
            <div class="info-value">{{client.fullName}}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Email</div>
            <div class="info-value">{{client.email}}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Téléphone</div>
            <div class="info-value">{{client.phone}}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Adresse</div>
            <div class="info-value">{{client.address}}, {{client.zipCode}} {{client.city}}</div>
          </div>
        </div>
      </div>

      <!-- Période -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">📅</div>
          <h2 class="section-title">Période de Location</h2>
        </div>
        <div class="info-card">
          <div class="info-row">
            <div class="info-label">Date de début</div>
            <div class="info-value">{{date contract.startDate}}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Date de fin</div>
            <div class="info-value">{{date contract.endDate}}</div>
          </div>
        </div>
      </div>

      <!-- Prestations -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">📋</div>
          <h2 class="section-title">Détail des Prestations</h2>
        </div>

        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th style="text-align: center; width: 80px;">Qté</th>
              <th style="text-align: right; width: 140px;">Prix Unit.</th>
              <th style="text-align: right; width: 140px;">Total</th>
            </tr>
          </thead>
          <tbody>
            {{#each dresses}}
            <tr>
              <td>
                <div style="font-weight: 600; font-size: 15px; color: #1f2937;">{{this.name}}</div>
                <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">{{this.reference}}</div>
              </td>
              <td style="text-align: center; font-weight: 600;">{{this.quantity}}</td>
              <td style="text-align: right;">{{currency this.pricePerDay}}</td>
              <td style="text-align: right; font-weight: 700; color: #667eea;">{{currency this.subtotal}}</td>
            </tr>
            {{/each}}
            {{#each addons}}
            <tr>
              <td>
                <div style="font-weight: 600; font-size: 15px; color: #1f2937;">{{this.name}}</div>
                <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Option</div>
              </td>
              <td style="text-align: center; font-weight: 600;">{{this.quantity}}</td>
              <td style="text-align: right;">{{currency this.price}}</td>
              <td style="text-align: right; font-weight: 700; color: #667eea;">{{currency this.subtotal}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-row">
            <span>Total Hors Taxes</span>
            <span style="font-weight: 600;">{{currency contract.totalHT}}</span>
          </div>
          <div class="totals-row final">
            <span>Total TTC</span>
            <span>{{currency contract.totalTTC}}</span>
          </div>
        </div>
        <div style="text-align: right; margin-top: 15px; color: #6b7280; font-size: 14px;">
          Acompte versé : <strong>{{currency contract.totalDeposit}}</strong>
        </div>
      </div>

      <!-- Signature -->
      <div class="signature-section">
        <div class="signature-title">✍️ Signature</div>
        {{#if signature}}
        <div style="background: white; padding: 30px; border-radius: 8px; text-align: center;">
          <div class="badge">✓ Signé électroniquement</div>
          <div style="color: #92400e; margin-top: 15px; font-weight: 500;">{{datetime signature.date}}</div>
        </div>
        {{else}}
        <div class="signature-box">
          <div style="color: #92400e; font-weight: 500; margin-bottom: 40px;">Signature du client</div>
          <div style="color: #6b7280;">Date : _______________</div>
        </div>
        {{/if}}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="org-name">{{org.name}}</div>
      <div>{{org.address}}, {{org.city}}</div>
      <div style="margin-top: 8px;">
        SIRET : {{org.siret}} <span class="divider">•</span> Tél : {{org.phone}} <span class="divider">•</span> {{org.email}}
      </div>
    </div>
  </div>
</body>
</html>`,
  },

  {
    id: "professional-clean",
    name: "💼 Professionnel Épuré",
    description: "Design corporate sobre et organisé avec sections structurées",
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrat {{contract.number}}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #374151;
      background: #f9fafb;
    }

    .page {
      max-width: 850px;
      margin: 30px auto;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* Header corporat */
    .header {
      background: #111827;
      padding: 40px 50px;
      border-bottom: 4px solid #3b82f6;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
    }

    .header-top h1 {
      font-size: 28px;
      font-weight: 700;
      color: white;
      margin: 0;
    }

    .contract-badge {
      background: #3b82f6;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .header-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      color: #d1d5db;
      font-size: 13px;
    }

    .header-info-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-info-label {
      color: #9ca3af;
      min-width: 100px;
    }

    .header-info-value {
      color: white;
      font-weight: 500;
    }

    .content {
      padding: 40px 50px;
    }

    /* Sections avec numérotation */
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }

    .section-number {
      display: inline-block;
      width: 32px;
      height: 32px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 32px;
      font-weight: 700;
      font-size: 15px;
      margin-right: 12px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
    }

    /* Tableau de données */
    .data-table {
      width: 100%;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }

    .data-row {
      display: grid;
      grid-template-columns: 180px 1fr;
      border-bottom: 1px solid #e5e7eb;
    }

    .data-row:last-child {
      border-bottom: none;
    }

    .data-label {
      background: #f9fafb;
      padding: 14px 20px;
      font-weight: 600;
      color: #6b7280;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-right: 1px solid #e5e7eb;
    }

    .data-value {
      padding: 14px 20px;
      color: #111827;
      font-weight: 500;
    }

    /* Tableau prestations */
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
      margin: 20px 0;
    }

    thead {
      background: #f9fafb;
      border-bottom: 2px solid #e5e7eb;
    }

    th {
      padding: 14px 16px;
      text-align: left;
      font-weight: 700;
      color: #374151;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 16px;
      border-bottom: 1px solid #f3f4f6;
      color: #374151;
      font-size: 14px;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    tbody tr:hover {
      background: #f9fafb;
    }

    /* Totaux */
    .totals-box {
      margin-top: 30px;
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      padding: 25px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 15px;
    }

    .totals-row.subtotal {
      color: #6b7280;
      padding-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 15px;
    }

    .totals-row.total {
      padding: 20px;
      margin: -25px -25px 15px -25px;
      background: #3b82f6;
      color: white;
      font-size: 22px;
      font-weight: 700;
      border-radius: 4px 4px 0 0;
    }

    .totals-row.deposit {
      color: #059669;
      font-weight: 600;
      font-size: 14px;
    }

    /* Signature */
    .signature-container {
      margin-top: 50px;
      padding: 30px;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      background: #fafafa;
    }

    .signature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      margin-top: 30px;
    }

    .signature-box {
      text-align: center;
      padding: 40px 20px;
      border: 2px dashed #d1d5db;
      border-radius: 4px;
      background: white;
    }

    .signature-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 50px;
      font-weight: 600;
    }

    /* Footer */
    .footer {
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 30px 50px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.8;
    }

    .footer-brand {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 12px;
    }

    .footer-sep {
      color: #3b82f6;
      margin: 0 8px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <h1>CONTRAT DE LOCATION</h1>
        <div class="contract-badge">N° {{contract.number}}</div>
      </div>
      <div class="header-info">
        <div class="header-info-item">
          <span class="header-info-label">Date d'émission:</span>
          <span class="header-info-value">{{date contract.createdAt}}</span>
        </div>
        <div class="header-info-item">
          <span class="header-info-label">Type:</span>
          <span class="header-info-value">{{contract.type}}</span>
        </div>
      </div>
    </div>

    <!-- Contenu -->
    <div class="content">
      <!-- Section 1: Client -->
      <div class="section">
        <h2 class="section-title">
          <span class="section-number">1</span>
          Informations du Client
        </h2>
        <div class="data-table">
          <div class="data-row">
            <div class="data-label">Nom complet</div>
            <div class="data-value">{{client.fullName}}</div>
          </div>
          <div class="data-row">
            <div class="data-label">Adresse email</div>
            <div class="data-value">{{client.email}}</div>
          </div>
          <div class="data-row">
            <div class="data-label">Téléphone</div>
            <div class="data-value">{{client.phone}}</div>
          </div>
          <div class="data-row">
            <div class="data-label">Adresse complète</div>
            <div class="data-value">{{client.address}}, {{client.zipCode}} {{client.city}}</div>
          </div>
        </div>
      </div>

      <!-- Section 2: Période -->
      <div class="section">
        <h2 class="section-title">
          <span class="section-number">2</span>
          Période de Location
        </h2>
        <div class="data-table">
          <div class="data-row">
            <div class="data-label">Date de début</div>
            <div class="data-value">{{date contract.startDate}}</div>
          </div>
          <div class="data-row">
            <div class="data-label">Date de fin</div>
            <div class="data-value">{{date contract.endDate}}</div>
          </div>
        </div>
      </div>

      <!-- Section 3: Prestations -->
      <div class="section">
        <h2 class="section-title">
          <span class="section-number">3</span>
          Détail des Prestations
        </h2>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="width: 80px; text-align: center;">Qté</th>
              <th style="width: 130px; text-align: right;">Prix Unit.</th>
              <th style="width: 130px; text-align: right;">Montant</th>
            </tr>
          </thead>
          <tbody>
            {{#each dresses}}
            <tr>
              <td>
                <div style="font-weight: 600; margin-bottom: 4px;">{{this.name}}</div>
                <div style="font-size: 12px; color: #6b7280;">Référence: {{this.reference}}</div>
              </td>
              <td style="text-align: center; font-weight: 600;">{{this.quantity}}</td>
              <td style="text-align: right;">{{currency this.pricePerDay}}</td>
              <td style="text-align: right; font-weight: 700;">{{currency this.subtotal}}</td>
            </tr>
            {{/each}}
            {{#each addons}}
            <tr>
              <td>
                <div style="font-weight: 600; margin-bottom: 4px;">{{this.name}}</div>
                <div style="font-size: 12px; color: #6b7280;">Option supplémentaire</div>
              </td>
              <td style="text-align: center; font-weight: 600;">{{this.quantity}}</td>
              <td style="text-align: right;">{{currency this.price}}</td>
              <td style="text-align: right; font-weight: 700;">{{currency this.subtotal}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>

        <div class="totals-box">
          <div class="totals-row total">
            <span>TOTAL TTC</span>
            <span>{{currency contract.totalTTC}}</span>
          </div>
          <div class="totals-row subtotal">
            <span>Total Hors Taxes</span>
            <span>{{currency contract.totalHT}}</span>
          </div>
          <div class="totals-row deposit">
            <span>✓ Acompte versé</span>
            <span>{{currency contract.totalDeposit}}</span>
          </div>
        </div>
      </div>

      <!-- Section 4: Signatures -->
      <div class="section">
        <h2 class="section-title">
          <span class="section-number">4</span>
          Signatures
        </h2>

        <div class="signature-container">
          {{#if signature}}
          <div style="background: #ecfdf5; border: 2px solid #10b981; padding: 25px; border-radius: 6px; text-align: center;">
            <div style="color: #065f46; font-weight: 700; font-size: 16px; margin-bottom: 8px;">
              ✓ SIGNÉ ÉLECTRONIQUEMENT
            </div>
            <div style="color: #065f46; font-size: 14px;">
              Le {{datetime signature.date}}
            </div>
          </div>
          {{else}}
          <div class="signature-grid">
            <div class="signature-box">
              <div class="signature-label">Le Client</div>
              <div style="color: #9ca3af; font-size: 13px;">Date : _______________</div>
            </div>
            <div class="signature-box">
              <div class="signature-label">{{org.name}}</div>
              <div style="color: #9ca3af; font-size: 13px;">Date : _______________</div>
            </div>
          </div>
          {{/if}}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-brand">{{org.name}}</div>
      <div>
        {{org.address}}, {{org.city}}
      </div>
      <div style="margin-top: 8px;">
        SIRET {{org.siret}} <span class="footer-sep">|</span> Tél. {{org.phone}} <span class="footer-sep">|</span> {{org.email}}
      </div>
    </div>
  </div>
</body>
</html>`,
  },

  {
    id: "rental-contract",
    name: "👗 Contrat de Location",
    description: "Template pour location de robes avec conditions de location",
    content: `<!-- En-tête du contrat -->
<div class="mb-6 text-center">
  <h1 class="text-2xl font-semibold text-gray-900">Contrat de location</h1>
  <p class="text-sm text-gray-600 mt-2">Contrat n° {{contract.contract_number}} — {{date contract.created_at format="DD/MM/YYYY"}}</p>
</div>

<!-- Informations client -->
<div class="mb-6">
  <h2 class="text-base font-semibold text-gray-900 mb-3">Informations client</h2>
  <div class="grid gap-3 md:grid-cols-2">
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Nom complet</p>
      <p class="mt-1 text-sm text-gray-800">{{client.fullName}}</p>
    </div>
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Email</p>
      <p class="mt-1 text-sm text-gray-800">{{client.email}}</p>
    </div>
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Téléphone</p>
      <p class="mt-1 text-sm text-gray-800">{{client.phone}}</p>
    </div>
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Adresse</p>
      <p class="mt-1 text-sm text-gray-800">{{client.address}}, {{client.zipCode}} {{client.city}}</p>
    </div>
  </div>
</div>

<!-- Détails du contrat -->
<div class="mb-6">
  <h2 class="text-base font-semibold text-gray-900 mb-3">Détails du contrat</h2>
  <div class="grid gap-3 md:grid-cols-2">
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Type de contrat</p>
      <p class="mt-1 text-sm text-gray-800">{{contract.contractType.name}}</p>
    </div>
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Période de location</p>
      <p class="mt-1 text-sm text-gray-800">{{date contract.startDate format="DD/MM/YYYY HH:mm"}} — {{date contract.endDate format="DD/MM/YYYY HH:mm"}}</p>
    </div>
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Méthode de paiement caution</p>
      <p class="mt-1 text-sm text-gray-800">{{contract.depositPaymentMethod}}</p>
    </div>
  </div>
</div>

<!-- Récapitulatif financier -->
<div class="mb-6">
  <h2 class="text-base font-semibold text-gray-900 mb-3">Récapitulatif financier</h2>
  <div class="space-y-4">
    <div>
      <h3 class="text-sm font-medium text-gray-700 mb-2">Montant total</h3>
      <div class="grid gap-2 md:grid-cols-2">
        <div class="rounded-lg bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase text-gray-500">Total HT</p>
          <p class="mt-1 text-lg font-semibold text-gray-900">{{currency contract.totalPriceHT}}</p>
        </div>
        <div class="rounded-lg bg-blue-50 p-3">
          <p class="text-xs font-semibold uppercase text-gray-500">Total TTC</p>
          <p class="mt-1 text-lg font-semibold text-blue-700">{{currency contract.totalPriceTTC}}</p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-sm font-medium text-gray-700 mb-2">Acompte</h3>
      <div class="grid gap-2 md:grid-cols-2">
        <div class="rounded-lg bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase text-gray-500">Acompte TTC</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{currency contract.accountTTC}}</p>
        </div>
        <div class="rounded-lg bg-green-50 p-3">
          <p class="text-xs font-semibold uppercase text-gray-500">Payé TTC</p>
          <p class="mt-1 text-sm font-semibold text-green-700">{{currency contract.accountPaidTTC}}</p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-sm font-medium text-gray-700 mb-2">Caution</h3>
      <div class="grid gap-2 md:grid-cols-2">
        <div class="rounded-lg bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase text-gray-500">Caution TTC</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{currency contract.cautionTTC}}</p>
        </div>
        <div class="rounded-lg bg-green-50 p-3">
          <p class="text-xs font-semibold uppercase text-gray-500">Payée TTC</p>
          <p class="mt-1 text-sm font-semibold text-green-700">{{currency contract.cautionPaidTTC}}</p>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Robes incluses -->
{{#if dresses}}
<div class="mb-6">
  <h2 class="text-base font-semibold text-gray-900 mb-3">Robes incluses ({{dresses.length}})</h2>
  <div class="space-y-3">
    {{#each dresses}}
    <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p class="font-medium text-gray-900">{{this.name}} — Réf. {{this.reference}}</p>
      {{#if this.typeName}}<p class="text-xs text-gray-600">Type: {{this.typeName}}</p>{{/if}}
      {{#if this.sizeName}}<p class="text-xs text-gray-600">Taille: {{this.sizeName}}</p>{{/if}}
      {{#if this.colorName}}<p class="text-xs text-gray-600">Couleur: {{this.colorName}}</p>{{/if}}
    </div>
    {{/each}}
  </div>
</div>
{{/if}}

<!-- Options -->
{{#if addons}}
<div class="mb-6">
  <h2 class="text-base font-semibold text-gray-900 mb-3">Options</h2>
  <div class="space-y-2">
    {{#each addons}}
    <div class="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <p class="font-medium text-gray-900">{{this.name}}</p>
      <p class="text-xs text-gray-500">{{currency this.priceTTC}} TTC</p>
    </div>
    {{/each}}
  </div>
</div>
{{/if}}

<!-- Clauses contractuelles -->
<div class="mt-8 space-y-4 text-sm">
  <h2 class="text-lg font-semibold text-gray-900">Conditions générales</h2>

  <p><strong>Entre les soussignés :</strong></p>

  <p>
    La société <strong>{{org.name}}</strong>, Société par actions simplifiée (SAS) immatriculée
    au registre du commerce et des sociétés sous le numéro <strong>{{org.siret}}</strong>,
    ayant son siège social au <strong>{{org.address}}, {{org.city}}</strong>,
    représentée par <strong>{{org.managerFullName}}</strong> en qualité de gérant(e),
    ci-après dénommée « le Prestataire ».
  </p>

  <p>
    Et le Client, <strong>{{client.fullName}}</strong>, domicilié(e) au {{client.address}}, {{client.zipCode}} {{client.city}},
    ci-après dénommé(e) « le Client ».
  </p>

  <p><strong>Il a alors été convenu ce qui suit :</strong></p>

  <h3 class="font-semibold mt-4">Article 1 – Description</h3>
  <p>
    Le présent contrat a pour objet de définir les modalités selon lesquelles le Prestataire
    fournira au Client un ensemble de services liés à la tenue de manifestations festives
    (mariage, fiançailles, cérémonies).
  </p>
  <ul class="list-disc space-y-1 pl-6">
    <li>Location des robes mariée, bijoux et accessoires (voiles, jupons).</li>
    <li>Location des robes invitées.</li>
  </ul>

  <h3 class="font-semibold mt-4">Article 2 – Conditions financières et caution</h3>
  <p>
    Un acompte de <strong>50 %</strong> du montant total de la location est exigé à la signature du contrat.
    Le solde est payable le jour de la récupération des robes, accompagné d'une caution.
  </p>
  <p>
    L'intégralité du paiement doit être effectuée selon ces modalités ; à défaut,
    la location ne pourra avoir lieu.
  </p>
  <p class="font-semibold text-red-600">
    ATTENTION : seules les cautions en empreinte CB ou en espèces sont acceptées.
    Aucun chèque ne sera accepté.
  </p>

  <h3 class="font-semibold mt-4">Article 3 – Résiliation / Annulation</h3>
  <p>
    Les contrats sont fermes et définitifs dès leur signature.
    Ils ne sont pas soumis au droit de rétractation prévu par l'article L212-20 du Code de la Consommation.
  </p>
  <p>
    L'acompte de 50 % versé reste acquis au Prestataire en cas d'annulation.
  </p>
  <p>
    La responsabilité du Prestataire ne pourra être engagée en cas de retard ou d'impossibilité
    d'exécution liée à un cas de force majeure, au sens de la jurisprudence de la Cour de cassation.
  </p>

  <h3 class="font-semibold mt-4">Article 4 – Responsabilité des parties</h3>
  <p>
    En cas de perte, dégât ou vol d'un article loué :
  </p>
  <ul class="list-disc space-y-1 pl-6">
    <li>la caution sera conservée si le bien est abîmé (trou, tâche, brûlure, déchirure) ;</li>
    <li>si le bien est réparable, le montant des retouches sera déduit de la caution ;</li>
    <li>si le bien est perdu, volé ou irréparable, le Prestataire pourra réclamer le prix d'achat du bien.</li>
  </ul>
  <p>
    Aucune des parties n'est responsable en cas de force majeure conformément à la jurisprudence française.
  </p>

  <h3 class="font-semibold mt-4">Article 5 – Restitution</h3>
  <p>
    Les biens loués doivent être restitués <strong>le dimanche</strong> (pour les locations week-end)
    aux heures d'ouverture du showroom.
  </p>

  <h3 class="font-semibold mt-4">Article 6 – Retard de restitution</h3>
  <p>En cas de retard, les pénalités suivantes s'appliquent :</p>
  <ul class="list-disc space-y-1 pl-6">
    <li>50 € par jour de retard et par robe invitée ;</li>
    <li>100 € par jour de retard et par robe mariée.</li>
  </ul>
  <p>
    Les biens doivent être retournés en <strong>parfait état</strong>. À défaut, une indemnité supplémentaire pourra être facturée.
  </p>

  <h3 class="font-semibold mt-4">Article 7 – Substitution</h3>
  <p>
    En cas d'impossibilité de fournir le bien réservé à la date souhaitée,
    {{org.name}} fournira un article de même catégorie ou de qualité supérieure,
    sans frais supplémentaires.
  </p>

  <h3 class="font-semibold mt-4">Article 8 – Non-restitution des accessoires</h3>
  <p>
    La non-restitution de la housse ou du cintre entraînera une indemnité forfaitaire
    de <strong>50 €</strong>.
  </p>

  <h3 class="font-semibold mt-4">Engagement et signature</h3>
  <p>
    En validant électroniquement ce contrat, le Client reconnaît avoir lu et accepté
    l'ensemble des conditions générales et particulières du présent document,
    qu'il accepte sans réserve.
  </p>
</div>`,
  },

  {
    id: "negafa-contract",
    name: "👰 Contrat Forfait Négafa",
    description: "Template complet pour prestation Négafa avec conditions détaillées",
    content: `<!-- En-tête du contrat -->
<div class="mb-6 text-center">
  <h1 class="text-2xl font-semibold text-gray-900">Contrat de prestation forfaitaire "Négafa"</h1>
  <p class="text-sm text-gray-600 mt-2">Contrat n° {{contract.contract_number}} — {{date contract.created_at format="DD/MM/YYYY"}}</p>
</div>

<!-- Informations client -->
<div class="mb-6">
  <h2 class="text-base font-semibold text-gray-900 mb-3">Informations client</h2>
  <div class="grid gap-3 md:grid-cols-2">
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Nom complet</p>
      <p class="mt-1 text-sm text-gray-800">{{client.fullName}}</p>
    </div>
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Email</p>
      <p class="mt-1 text-sm text-gray-800">{{client.email}}</p>
    </div>
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Téléphone</p>
      <p class="mt-1 text-sm text-gray-800">{{client.phone}}</p>
    </div>
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Adresse</p>
      <p class="mt-1 text-sm text-gray-800">{{client.address}}, {{client.zipCode}} {{client.city}}</p>
    </div>
  </div>
</div>

<!-- Détails du contrat -->
<div class="mb-6">
  <h2 class="text-base font-semibold text-gray-900 mb-3">Détails du contrat</h2>
  <div class="grid gap-3 md:grid-cols-2">
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Type de contrat</p>
      <p class="mt-1 text-sm text-gray-800">{{contract.contractType.name}}</p>
    </div>
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Période de prestation</p>
      <p class="mt-1 text-sm text-gray-800">{{date contract.startDate format="DD/MM/YYYY HH:mm"}} — {{date contract.endDate format="DD/MM/YYYY HH:mm"}}</p>
    </div>
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Méthode de paiement caution</p>
      <p class="mt-1 text-sm text-gray-800">{{contract.depositPaymentMethod}}</p>
    </div>
  </div>
</div>

<!-- Forfait -->
{{#if contract.package}}
<div class="mb-6">
  <h2 class="text-base font-semibold text-gray-900 mb-3">Forfait</h2>
  <div class="grid gap-3 md:grid-cols-2">
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Nom du forfait</p>
      <p class="mt-1 text-sm text-gray-800">{{contract.package.name}}</p>
    </div>
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Nombre de robes incluses</p>
      <p class="mt-1 text-sm text-gray-800">{{contract.package.numDresses}} {{#if (gt contract.package.numDresses 1)}}robes{{else}}robe{{/if}}</p>
    </div>
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Prix HT</p>
      <p class="mt-1 text-sm text-gray-800">{{currency contract.package.priceHT}}</p>
    </div>
    <div>
      <p class="text-xs font-semibold uppercase text-gray-500">Prix TTC</p>
      <p class="mt-1 text-sm text-gray-800">{{currency contract.package.priceTTC}}</p>
    </div>
  </div>
</div>
{{/if}}

<!-- Récapitulatif financier -->
<div class="mb-6">
  <h2 class="text-base font-semibold text-gray-900 mb-3">Récapitulatif financier</h2>
  <div class="space-y-4">
    <div>
      <h3 class="text-sm font-medium text-gray-700 mb-2">Montant total</h3>
      <div class="grid gap-2 md:grid-cols-2">
        <div class="rounded-lg bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase text-gray-500">Total HT</p>
          <p class="mt-1 text-lg font-semibold text-gray-900">{{currency contract.totalPriceHT}}</p>
        </div>
        <div class="rounded-lg bg-blue-50 p-3">
          <p class="text-xs font-semibold uppercase text-gray-500">Total TTC</p>
          <p class="mt-1 text-lg font-semibold text-blue-700">{{currency contract.totalPriceTTC}}</p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-sm font-medium text-gray-700 mb-2">Acompte</h3>
      <div class="grid gap-2 md:grid-cols-2">
        <div class="rounded-lg bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase text-gray-500">Acompte TTC</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{currency contract.accountTTC}}</p>
        </div>
        <div class="rounded-lg bg-green-50 p-3">
          <p class="text-xs font-semibold uppercase text-gray-500">Payé TTC</p>
          <p class="mt-1 text-sm font-semibold text-green-700">{{currency contract.accountPaidTTC}}</p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-sm font-medium text-gray-700 mb-2">Caution</h3>
      <div class="grid gap-2 md:grid-cols-2">
        <div class="rounded-lg bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase text-gray-500">Caution TTC</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{currency contract.cautionTTC}}</p>
        </div>
        <div class="rounded-lg bg-green-50 p-3">
          <p class="text-xs font-semibold uppercase text-gray-500">Payée TTC</p>
          <p class="mt-1 text-sm font-semibold text-green-700">{{currency contract.cautionPaidTTC}}</p>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Robes incluses -->
{{#if dresses}}
<div class="mb-6">
  <h2 class="text-base font-semibold text-gray-900 mb-3">Robes incluses ({{dresses.length}})</h2>
  <div class="space-y-3">
    {{#each dresses}}
    <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p class="font-medium text-gray-900">{{this.name}} — Réf. {{this.reference}}</p>
      {{#if this.typeName}}<p class="text-xs text-gray-600">Type: {{this.typeName}}</p>{{/if}}
      {{#if this.sizeName}}<p class="text-xs text-gray-600">Taille: {{this.sizeName}}</p>{{/if}}
      {{#if this.colorName}}<p class="text-xs text-gray-600">Couleur: {{this.colorName}}</p>{{/if}}
    </div>
    {{/each}}
  </div>
</div>
{{/if}}

<!-- Options -->
{{#if addons}}
<div class="mb-6">
  <h2 class="text-base font-semibold text-gray-900 mb-3">Options</h2>
  <div class="space-y-2">
    {{#each addons}}
    <div class="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <div class="flex-1">
        <p class="font-medium text-gray-900">{{this.name}}</p>
        {{#if this.description}}<p class="text-xs text-gray-600">{{this.description}}</p>{{/if}}
      </div>
      <p class="text-xs text-gray-500">{{currency this.priceTTC}} TTC</p>
    </div>
    {{/each}}
  </div>
</div>
{{/if}}

<!-- Clauses contractuelles -->
<div class="mt-8 space-y-4 text-sm">
  <h2 class="text-lg font-semibold text-gray-900">Conditions générales</h2>

  <p><strong>Entre les soussignés :</strong></p>
  <p>
    La société <strong>{{org.name}}</strong>, société par actions simplifiée (SAS) immatriculée sous le numéro
    <strong>{{org.siret}}</strong>, sise {{org.address}}, {{org.city}}, représentée par
    <strong>{{org.managerFullName}}</strong> en qualité de gérant(e), ci-après dénommée « le Prestataire ».
  </p>
  <p>
    Et le Client, <strong>{{client.fullName}}</strong>, domicilié(e) au {{client.address}}, {{client.zipCode}} {{client.city}},
    joignable au {{client.phone}} et à l'adresse email {{client.email}}, ci-après dénommé(e) « le Client ».
  </p>

  <h3 class="font-semibold mt-4">Article 1 – Objet du contrat</h3>
  <p>
    Le présent contrat encadre une prestation de préparation, habillage, accompagnement et location de tenues traditionnelles
    fournie pour un événement personnel (mariage, fiançailles, cérémonie).
  </p>

  <h3 class="font-semibold mt-4">Article 2 – Description de la prestation</h3>
  <ul class="list-disc space-y-1 pl-6">
    <li>Essayage et sélection des tenues au showroom {{org.name}}.</li>
    <li>Location des tenues traditionnelles, accessoires et parures.</li>
    <li>Habillage et préparation de la Mariée sur place le jour J.</li>
    <li>Accompagnement, changements de tenues et présence continue dans la limite définie au présent contrat.</li>
  </ul>

  <h3 class="font-semibold mt-4">Article 3 – Durée de la prestation</h3>
  <p>
    La prestation est limitée à <strong>sept (7) heures consécutives</strong> (ex. 19h00 – 02h00).
    Toute heure supplémentaire entamée est facturée <strong>150 € TTC</strong>.
  </p>

  <h3 class="font-semibold mt-4">Article 4 – Mise à disposition d'un espace sécurisé</h3>
  <p>Le Client s'engage à fournir un espace dédié conforme aux exigences suivantes :</p>
  <ul class="list-disc space-y-1 pl-6">
    <li>Une loge ou un local sécurisé, fermé par clé ou code, destiné au matériel et à la préparation.</li>
    <li>Aucun objet personnel ou de valeur n'y est entreposé par le Client ou ses invités.</li>
    <li>{{org.name}} décline toute responsabilité en cas de perte, vol ou détérioration de biens tiers.</li>
    <li>Seule la négafa détient la clé ou le dispositif d'ouverture pendant la prestation.</li>
    <li>La loge est strictement réservée à la Mariée et au Prestataire.</li>
    <li>Le repas de la négafa (et de son assistante le cas échéant) est à la charge du Client.</li>
  </ul>

  <h3 class="font-semibold mt-4">Article 5 – Conditions financières</h3>
  <p>
    Les tarifs appliqués correspondent au forfait sélectionné par le Client.
    Un acompte de <strong>50 %</strong> est exigé à la signature du contrat.
    Le solde est dû à la remise des tenues.
  </p>
  <p>
    Tout retard ou défaut de paiement peut entraîner la suspension ou l'annulation de la prestation, sans indemnité pour le Client.
  </p>

  <h3 class="font-semibold mt-4">Article 6 – Caution</h3>
  <p>
    Une caution est obligatoire pour toute location. Elle est restituée après vérification de l'état du matériel.
    Toute perte, détérioration, tâche irréversible, brûlure, vol ou dommage entraîne une retenue partielle ou totale,
    sans préjudice d'une facturation complémentaire si nécessaire.
  </p>

  <h3 class="font-semibold mt-4">Article 7 – Substitution</h3>
  <p>
    En cas d'impossibilité indépendante de la volonté du Prestataire de fournir les biens initialement réservés,
    un bien de catégorie équivalente ou supérieure est proposé sans frais supplémentaires.
    Cette substitution n'est pas considérée comme un manquement contractuel.
  </p>

  <h3 class="font-semibold mt-4">Article 8 – Annulation</h3>
  <p>
    En cas d'annulation par le Client, l'acompte demeure acquis au Prestataire,
    sauf cas de force majeure dûment justifié. Toute demande d'annulation doit être formulée par écrit.
  </p>

  <h3 class="font-semibold mt-4">Article 9 – Engagement et signature</h3>
  <p>
    Le Client atteste avoir pris connaissance et accepté l'ensemble des conditions générales et particulières du présent contrat.
    L'acceptation électronique vaut signature manuscrite conformément à l'article 1367 du Code civil.
  </p>
</div>`,
  },
];
