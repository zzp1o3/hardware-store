import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useProductStore } from '../store/productStore';
import { showToast } from '../utils/toast';

export const AddProductScreen: React.FC = () => {
  const { addProduct } = useProductStore();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');

  const handleAddProduct = async () => {
    if (!name.trim() || !price.trim() || !location.trim()) {
      Alert.alert('错误', '请填写完整信息');
      return;
    }

    // 获取本地时间字符串，避免时区问题
    const now = new Date();
    const localDateStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();

    await addProduct({
      name,
      price: parseFloat(price),
      location,
      createdAt: localDateStr,
    });

    setName('');
    setPrice('');
    setLocation('');
    showToast('商品已添加');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>添加新商品</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="商品名称（如：M4螺丝）"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="价格（元）"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="位置（如：A区3排）"
          value={location}
          onChangeText={setLocation}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
          <Text style={styles.buttonText}>➕ 添加</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: 'white',
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
});