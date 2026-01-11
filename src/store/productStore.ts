import { create } from 'zustand';
import { Product } from '../types';
import { searchProducts, getAllProducts, addProduct, deleteProduct } from '../database/queries';
<<<<<<< HEAD
import { emit } from '../utils/eventBus';
=======
>>>>>>> 2d0c13b0a56d9f815b6a4fbc3e2d799a303445d8

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
<<<<<<< HEAD
    emit('productsUpdated'); // 通知商品页面刷新
=======
>>>>>>> 2d0c13b0a56d9f815b6a4fbc3e2d799a303445d8
  },

  deleteProduct: async (id) => {
    await deleteProduct(id);
    await get().loadProducts();
<<<<<<< HEAD
    emit('productsUpdated'); // 通知商品页面刷新
=======
>>>>>>> 2d0c13b0a56d9f815b6a4fbc3e2d799a303445d8
  },
}));