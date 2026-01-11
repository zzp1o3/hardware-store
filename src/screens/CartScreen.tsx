import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import EmptyState from '../components/EmptyState';
import { showToast } from '../utils/toast';
import { useCartStore } from '../store/cartStore';
import { addOrder } from '../database/queries';
import { Platform } from 'react-native';
import { emit } from '../utils/eventBus';

export const CartScreen: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCartStore();

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('提示', '购物车为空');
      return;
    }

    Alert.alert(
      '确认订单',
      `共 ${items.length} 种商品，总计 ¥${getTotalPrice().toFixed(2)}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: async () => {
            try {
              const itemsJson = JSON.stringify(items);
              const total = getTotalPrice();
              const createdAt = new Date().toISOString();

              await addOrder(itemsJson, total, createdAt);

              // 保存成功后清空购物车
              clearCart();

              // 通知统计页刷新
              emit('ordersUpdated');

              // 显示统一 Toast 提示
              showToast('订单完成，今日收益已更新', 'success');
            } catch (err) {
              console.error('保存订单失败', err);
              Alert.alert('错误', '保存订单失败，请稍后重试');
            }
          },
        },
      ]
    );
  };

  if (items.length === 0) {
    return <EmptyState icon="🛒" title="购物车是空的" subtitle="去添加一些商品吧" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>¥{item.price.toFixed(2)}</Text>
            </View>
            
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
              >
                <Text style={styles.qtyButtonText}>-</Text>
              </TouchableOpacity>
              
              <Text style={styles.quantity}>{item.quantity}</Text>
              
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.total}>
          <Text style={styles.totalLabel}>总计：</Text>
          <Text style={styles.totalAmount}>¥{getTotalPrice().toFixed(2)}</Text>
        </View>
        
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={[styles.checkoutButton, styles.clearButton]}
            onPress={() => {
              Alert.alert('清空购物车', '确定要清空购物车吗？', [
                { text: '取消', style: 'cancel' },
                { text: '清空', style: 'destructive', onPress: () => {
                  clearCart();
                  showToast('购物车已清空');
                } },
              ]);
            }}
          >
            <Text style={styles.checkoutButtonText}>清空购物车</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutButtonText}>结算订单</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  item: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyButton: {
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  footerButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  clearButton: { backgroundColor: '#FF3B30', marginRight: 8 },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});