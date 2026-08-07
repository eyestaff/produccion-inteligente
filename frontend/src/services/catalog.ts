import { fetchApi } from './api';

export interface Store {
  id: number;
  name: string;
}

export interface BusinessLine {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
}

export const CatalogAPI = {
  getStores: () => fetchApi('/stores') as Promise<Store[]>,
  getBusinessLines: () => fetchApi('/business-lines') as Promise<BusinessLine[]>,
  getProducts: () => fetchApi('/products') as Promise<Product[]>,
};
