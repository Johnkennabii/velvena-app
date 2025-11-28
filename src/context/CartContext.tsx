import type React from "react";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { DressDetails } from "../api/endpoints/dresses";

interface CartItem {
  dress: DressDetails;
  addedAt: number; // timestamp
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  addDress: (dress: DressDetails) => void;
  removeDress: (dressId: string) => void;
  clearCart: () => void;
  hasDress: (dressId: string) => boolean;
  reorderDresses: (startIndex: number, endIndex: number) => void;
  setMainDress: (dressId: string) => void;
  mainDressId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "allure_cart_items";
const MAIN_DRESS_STORAGE_KEY = "allure_main_dress_id";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Charger depuis localStorage au démarrage
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Erreur lors du chargement du panier:", error);
      return [];
    }
  });

  const [mainDressId, setMainDressIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(MAIN_DRESS_STORAGE_KEY);
    } catch (error) {
      return null;
    }
  });

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du panier:", error);
    }
  }, [items]);

  useEffect(() => {
    try {
      if (mainDressId) {
        localStorage.setItem(MAIN_DRESS_STORAGE_KEY, mainDressId);
      } else {
        localStorage.removeItem(MAIN_DRESS_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la robe principale:", error);
    }
  }, [mainDressId]);

  const addDress = useCallback((dress: DressDetails) => {
    setItems((prev) => {
      // Vérifier si la robe existe déjà
      if (prev.some((item) => item.dress.id === dress.id)) {
        return prev;
      }
      return [...prev, { dress, addedAt: Date.now() }];
    });
  }, []);

  const removeDress = useCallback((dressId: string) => {
    setItems((prev) => prev.filter((item) => item.dress.id !== dressId));
    // Si on supprime la robe principale, la retirer
    setMainDressIdState((prev) => (prev === dressId ? null : prev));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setMainDressIdState(null);
  }, []);

  const hasDress = useCallback(
    (dressId: string) => {
      return items.some((item) => item.dress.id === dressId);
    },
    [items]
  );

  const reorderDresses = useCallback((startIndex: number, endIndex: number) => {
    setItems((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const setMainDress = useCallback((dressId: string) => {
    setMainDressIdState(dressId);
  }, []);

  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        addDress,
        removeDress,
        clearCart,
        hasDress,
        reorderDresses,
        setMainDress,
        mainDressId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart doit être utilisé dans un CartProvider");
  }
  return context;
};
