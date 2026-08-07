import { fetchApi } from './api';

export interface Category {
  id: number;
  companyId: number;
  parentId: number | null;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
}

export interface Store {
  id: number;
  name: string;
}

export interface BusinessLine {
  id: number;
  name: string;
}

export interface CreateProductInput {
  businessLineId?: number | null;
  categoryId?: number | null;
  code: string;
  name: string;
  type?: string;
  baseUnit?: string;
  cost?: number;
  price?: number;
  status?: string;
}

export interface UpdateProductInput {
  businessLineId?: number | null;
  categoryId?: number | null;
  code?: string;
  name?: string;
  type?: string;
  baseUnit?: string;
  cost?: number;
  price?: number;
  status?: string;
}

export interface CreateCategoryInput {
  parentId?: number | null;
  name: string;
  description?: string | null;
  status?: string;
}

export interface Product {
  id: number;
  businessLineId: number | null;
  categoryId: number | null;
  categoryName?: string;
  code: string;
  name: string;
  type: string;
  baseUnit: string;
  cost: number;
  price: number;
  status: string;
  createdAt: string;
}

export const CatalogAPI = {
  getStores: () => fetchApi('/stores') as Promise<Store[]>,
  getBusinessLines: () => fetchApi('/business-lines') as Promise<BusinessLine[]>,
  getProducts: () => fetchApi('/products') as Promise<Product[]>,

  async createProduct(input: CreateProductInput): Promise<Product> {
    return fetchApi('/products', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateProduct(id: number, input: UpdateProductInput): Promise<Product> {
    return fetchApi(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async getCategories(): Promise<Category[]> {
    return fetchApi('/categories');
  },

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    return fetchApi('/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
