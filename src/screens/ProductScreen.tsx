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

    // 添加事件监听器，监听商品更新事件
    const handleProductsUpdated = () => {
      loadProducts();
    };

    const handleOrdersUpdated = () => {
      loadProducts();
    };

    on('productsUpdated', handleProductsUpdated);
    on('ordersUpdated', handleOrdersUpdated);

    // 清理函数
    return () => {
      off('productsUpdated', handleProductsUpdated);
      off('ordersUpdated', handleOrdersUpdated);
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
          showToast('商品已删除');
        } catch (err) {
          console.error('删除商品失败', err);
          Alert.alert('错误', '删除商品失败');
        }
      }},
    ]);
  };

  const displayProducts = searchQuery.trim() ? searchResults : products;

  if (isLoading) {
    return <Loading text="加载中..." />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>新院电料水暖</Text>

      <TextInput
        style={[styles.input, styles.searchInput]}
        placeholder="🔍 搜索商品或位置..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <FlatList
        data={displayProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProductCard product={item} onDelete={handleDelete} />
        )}
        ListEmptyComponent={<EmptyState icon="📦" title="暂无商品" subtitle="请前往 添加 页面添加新商品" />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  searchInput: {
    fontSize: 16,
  },
});