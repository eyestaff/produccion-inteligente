import { useState, useEffect } from 'react';

const STORE_KEY = 'produccion_inteligente_selected_store';

export function useStoreSelection(initialStoreId?: number) {
  const [storeId, setStoreId] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) return parseInt(saved, 10);
    return initialStoreId || null;
  });

  useEffect(() => {
    if (storeId !== null) {
      localStorage.setItem(STORE_KEY, storeId.toString());
    }
  }, [storeId]);

  return [storeId, setStoreId] as const;
}
