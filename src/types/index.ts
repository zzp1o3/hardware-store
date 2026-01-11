export interface Product {
  id: number;
  name: string;
  price: number;
  location: string;
  createdAt: string;
}

export interface CartItem extends Product {
  quantity: number;
}