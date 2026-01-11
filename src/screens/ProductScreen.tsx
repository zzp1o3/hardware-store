import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { showToast } from '../utils/toast';
import { useProductStore } from '../store/productStore';
import { initDatabase } from '../database/init';
import { ProductCard } from '../components/ProductCard';
import { on, off } from '../utils/eventBus';

export const ProductScreen: React.FC = () => {
  const { products, searchResults, isLoading, loadProducts, search, deleteProduct } = useProductStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    initDatabase();
    loadProducts();
    
    // 监听商品更新事件，实现导入后自动刷新
    const unsubscribe = on('productsUpdated', () => {
      console.log('收到商品更新事件，刷新商品列表');
      loadProducts();
    });
    
    // 监听订单更新事件，因为订单变化可能也需要刷新商品状态
    const unsubscribeOrders = on('ordersUpdated', () => {
      console.log('收到订单更新事件，刷新商品列表');
      loadProducts();
    });
    
    // 清理函数
    return () => {
      unsubscribe();
      unsubscribeOrders();
    };
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    search(text);
  };


  const handleDelete = (id: number) => {
    Alert.alert('确认删除', '确定要删除这个商品吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        try {
          await deleteProduct(id);
          Alert.alert('成功', '商品已删除');
        } catch (err) {
          console.error('删除商品失败', err);
          Alert.alert('错误', '删除商品失败');
        }
      }},
    ]);
  };

  const displayProducts = searchQuery.trim() ? searchResults : products;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>新院电料水暖</Text>

      {/* 添加表单已移至独立的“添加”页面 */}

      <TextInput
        style={[styles.input, styles.searchInput]}
        placeholder="🔍 搜索商品或位置..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {isLoading ? (
        <Loading text="加载中..." />
      ) : (
        <FlatList
          data={displayProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ProductCard product={item} onDelete={handleDelete} />
          )}
          ListEmptyComponent={<EmptyState icon="📦" title="暂无商品" subtitle="请前往 添加 页面添加新商品" />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#999',
  },
});