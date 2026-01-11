import { create } from 'zustand';
import { Product } from '../types';
import { searchProducts, getAllProducts, addProduct, deleteProduct } from '../database/queries';

interface ProductStore {
  products: Product[];
  searchResults: Product[];
  isLoading: boolean;
  
  loadProducts: () => Promise<void>;
  search: (keyword: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  searchResults: [],
  isLoading: false,

  loadProducts: async () => {
    set({ isLoading: true });
    const products = await getAllProducts();
    set({ products, isLoading: false });
  },

  search: async (keyword: string) => {
    if (!keyword.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ isLoading: true });
    const results = await searchProducts(keyword);
    set({ searchResults: results, isLoading: false });
  },

  addProduct: async (product) => {
    await addProduct(product);
    await get().loadProducts();
  },

  deleteProduct: async (id) => {
    await deleteProduct(id);
    await get().loadProducts();
  },
}));