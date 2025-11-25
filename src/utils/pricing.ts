/**
 * Utilitaires de calcul de prix et TVA
 */

/**
 * Taux de TVA français standard (20%)
 */
export const VAT_RATE = 0.20;

/**
 * Ratio de conversion TTC → HT (1 / 1.20 = 0.833333...)
 * Utilisé pour calculer HT à partir de TTC
 */
export const VAT_RATIO = 1 / (1 + VAT_RATE);

/**
 * Calcule le prix TTC à partir du prix HT
 * @param ht Prix hors taxes
 * @returns Prix TTC (toutes taxes comprises)
 */
export const calculateTTC = (ht: number | string): number => {
  const htValue = typeof ht === "string" ? parseFloat(ht) : ht;

  if (isNaN(htValue) || htValue < 0) {
    return 0;
  }

  return htValue * (1 + VAT_RATE);
};

/**
 * Calcule le prix HT à partir du prix TTC
 * @param ttc Prix toutes taxes comprises
 * @returns Prix HT (hors taxes)
 */
export const calculateHT = (ttc: number | string): number => {
  const ttcValue = typeof ttc === "string" ? parseFloat(ttc) : ttc;

  if (isNaN(ttcValue) || ttcValue < 0) {
    return 0;
  }

  return ttcValue * VAT_RATIO;
};

/**
 * Calcule le montant de la TVA
 * @param ht Prix hors taxes
 * @returns Montant de la TVA
 */
export const calculateVAT = (ht: number | string): number => {
  const htValue = typeof ht === "string" ? parseFloat(ht) : ht;

  if (isNaN(htValue) || htValue < 0) {
    return 0;
  }

  return htValue * VAT_RATE;
};

/**
 * Arrondit un prix à 2 décimales
 * @param value Valeur à arrondir
 * @returns Valeur arrondie à 2 décimales
 */
export const roundPrice = (value: number | string): number => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return 0;
  }

  return Math.round(numValue * 100) / 100;
};

/**
 * Calcule le prix total pour plusieurs articles
 * @param items Tableau d'objets avec prix et quantité
 * @returns Prix total
 */
export const calculateTotal = (
  items: Array<{ price: number | string; quantity?: number }>
): number => {
  return items.reduce((total, item) => {
    const price = typeof item.price === "string" ? parseFloat(item.price) : item.price;
    const quantity = item.quantity || 1;

    if (isNaN(price) || price < 0) {
      return total;
    }

    return total + price * quantity;
  }, 0);
};

/**
 * Calcule une remise
 * @param price Prix original
 * @param discountPercent Pourcentage de remise (0-100)
 * @returns Prix après remise
 */
export const applyDiscount = (
  price: number | string,
  discountPercent: number | string
): number => {
  const priceValue = typeof price === "string" ? parseFloat(price) : price;
  const discountValue =
    typeof discountPercent === "string" ? parseFloat(discountPercent) : discountPercent;

  if (isNaN(priceValue) || isNaN(discountValue) || priceValue < 0 || discountValue < 0) {
    return 0;
  }

  return priceValue * (1 - discountValue / 100);
};
