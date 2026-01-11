import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Product } from '../types';
import { useCartStore } from '../store/cartStore';

interface ProductCardProps {
  product: Product;
  onDelete: (id: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete }) => {
  const { addToCart } = useCartStore();

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.detail}>💰 ¥{product.price.toFixed(2)}</Text>
        <Text style={styles.detail}>📍 {product.location}</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => addToCart(product)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => onDelete(product.id)}>
          <Text style={styles.deleteButton}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  deleteButton: {
    fontSize: 24,
    padding: 4,
  },
});