import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Share, Modal, TextInput, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, PermissionsAndroid } from 'react-native';
import { getAllProducts, addProduct, getProductsCount, getOrdersCount, clearProducts, clearOrders, getProductByName } from '../database/queries';
import { showToast } from '../utils/toast';
import { useProductStore } from '../store/productStore';
import { emit } from '../utils/eventBus';

export const SettingsScreen: React.FC = () => {
  const [productCount, setProductCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const { loadProducts } = useProductStore();

  // 导出历史记录状态
  const [history, setHistory] = useState<Array<{ uri: string; name: string; size?: number; modificationTime?: number }>>([]);

  const loadHistory = async () => {
    try {
      const candidateDirs = [FileSystem.documentDirectory || ''];
      if (Platform.OS === 'android') {
        candidateDirs.push('/storage/emulated/0/Documents/');
        candidateDirs.push('/sdcard/Documents/');
        candidateDirs.push('/storage/emulated/0/Download/');
        candidateDirs.push('/sdcard/Download/');
      }
      const list = [] as Array<{ uri: string; name: string; size?: number; modificationTime?: number }>;
      for (const dir of candidateDirs) {
        if (!dir) continue;
        try {
          const all = await FileSystem.readDirectoryAsync(dir);
          for (const name of all) {
            if (name.startsWith('products_export_') && name.endsWith('.json')) {
              const uri = dir + name;
              const info = await FileSystem.getInfoAsync(uri);
              const size = (info as any).size;
              const modificationTime = (info as any).modificationTime;
              list.push({ uri, name, size, modificationTime });
            }
          }
        } catch (e) {
          // ignore unreadable dirs
        }
      }
      // sort by newest
      list.sort((a, b) => (b.modificationTime || 0) - (a.modificationTime || 0));
      setHistory(list);
    } catch (err) {
      console.error('加载导出历史失败', err);
    }
  };

  const loadStats = async () => {
    try {
      const pc = await getProductsCount();
      const oc = await getOrdersCount();
      setProductCount(pc);
      setOrderCount(oc);
    } catch (err) {
      console.error('加载统计失败', err);
    }
  };

  useEffect(() => { loadStats(); }, []);

  // URL import/export states
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [exportUrlVisible, setExportUrlVisible] = useState(false);
  const [exportUrl, setExportUrl] = useState('');

  const handleOpenUrlModal = () => {
    setUrlInput('');
    setUrlModalVisible(true);
  };

  const handleImportFromUrlConfirm = async () => {
    if (!urlInput) {
      Alert.alert('请输入 URL', '请输入包含商品数组的 JSON 文件 URL');
      return;
    }
    setUrlLoading(true);
    try {
      let text = '';
      if (urlInput.startsWith('data:')) {
        const idx = urlInput.indexOf(',');
        if (idx === -1) throw new Error('无效 data URL');
        const meta = urlInput.substring(0, idx);
        const payload = urlInput.substring(idx + 1);
        // helper: robust percent-decoder
        const safeDecode = (s: string) => {
          if (!s) return s;
          // replace + with space
          let t = s.replace(/\+/g, ' ');
          try {
            return decodeURIComponent(t);
          } catch (e) {
            // escape stray '%' characters not followed by two hex digits
            const fixed = t.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
            try {
              return decodeURIComponent(fixed);
            } catch (e2) {
              return t;
            }
          }
        };

        if (meta.includes(';base64')) {
          let decoded = '';
          try {
            if (typeof Buffer !== 'undefined') {
              decoded = Buffer.from(payload, 'base64').toString('utf8');
            } else if (typeof (globalThis as any).atob === 'function') {
              const bstr = (globalThis as any).atob(payload);
              try {
                decoded = decodeURIComponent(escape(bstr));
              } catch (e) {
                decoded = bstr;
              }
            } else {
              decoded = payload; // fallback, may be base64 text
            }
          } catch (e) {
            decoded = payload;
          }
          text = decoded;
        } else {
          text = safeDecode(payload);
        }
        // strip BOM if present
        if (text && text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }
      } else {
        const res = await fetch(urlInput);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        text = await res.text();
      }
      const items = JSON.parse(text);
      if (!Array.isArray(items)) {
        Alert.alert('格式错误', 'URL 返回的内容不是商品数组');
        setUrlLoading(false);
        return;
      }
      let added = 0;
      let skipped = 0;
      for (const it of items) {
        const prodName = (it.name || '').toString().trim();
        if (!prodName) {
          skipped++;
          continue;
        }
        const existing = await getProductByName(prodName);
        if (existing) {
          skipped++;
          continue;
        }
        const product = {
          name: prodName,
          price: Number(it.price) || 0,
          location: it.location || '',
          createdAt: it.createdAt || new Date().toISOString(),
        };
        await addProduct(product);
        added++;
      }
      await loadProducts();
      emit('ordersUpdated');
      emit('productsUpdated'); // 通知商品页面刷新
      showToast(`已从 URL 导入 ${added} 条商品，跳过 ${skipped} 条（名称重复或无名）`);
      loadStats();
      setUrlModalVisible(false);
    } catch (err) {
      console.error('URL 导入失败', err);
      Alert.alert('导入失败', String(err));
    } finally {
      setUrlLoading(false);
    }
  };

  const handleExportToDataUrl = async () => {
    try {
      const products = await getAllProducts();
      const json = JSON.stringify(products, null, 2);
      const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
      setExportUrl(dataUrl);
      setExportUrlVisible(true);
      showToast('已生成可分享的 data URL（可复制或分享）');
    } catch (err) {
      console.error('导出为 URL 失败', err);
      Alert.alert('错误', '导出为 URL 失败');
    }
  };

  const handleExportToFile = async () => {
    try {
      // 检查安卓写入权限
      if (Platform.OS === 'android') {
        console.log('检测到Android平台，检查写入权限...');
        const hasPermission = await ensureAndroidWritePermission();
        if (!hasPermission) {
          Alert.alert('权限不足', '需要写入存储权限才能导出文件');
          return;
        }
        console.log('写入权限检查通过');
      }

      const products = await getAllProducts();
      const json = JSON.stringify(products, null, 2);
      const name = `hardware-export-${Date.now()}.json`;
      const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
      const path = dir + name;
      const hasEncoding = (FileSystem as any).EncodingType && (FileSystem as any).EncodingType.UTF8;
      const writeOpts = hasEncoding ? { encoding: (FileSystem as any).EncodingType.UTF8 } : undefined;
      if (writeOpts) await FileSystem.writeAsStringAsync(path, json, writeOpts);
      else await FileSystem.writeAsStringAsync(path, json);
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) throw new Error(`写入失败：文件未创建 (${path})`);
      // use expo-sharing to let user save/send the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'application/json' });
      } else {
        // fallback: copy JSON to clipboard and inform user
        try {
          await Clipboard.setStringAsync(json);
          await Share.share({ message: `导出文件已保存到 ${path}，内容已复制到剪贴板` });
        } catch (e) {
          await Share.share({ message: `导出已保存到 ${path}` });
        }
      }
      showToast(`已生成文件：${path}`);
    } catch (err) {
      console.error('导出为文件失败', err);
      Alert.alert('导出失败', String(err));
    }
  };

  const handleImportFromClipboard = async () => {
    try {
      const s = await Clipboard.getStringAsync();
      if (!s) {
        Alert.alert('剪贴板为空', '剪贴板没有内容可导入');
        return;
      }
      // if it's a data URL or JSON text, reuse URL import logic
      setUrlLoading(true);
      let text = s;
      if (s.startsWith('data:')) {
        const idx = s.indexOf(',');
        if (idx === -1) throw new Error('无效 data URL');
        const meta = s.substring(0, idx);
        const payload = s.substring(idx + 1);
        if (meta.includes(';base64')) {
          let decoded = '';
          try {
            if (typeof Buffer !== 'undefined') decoded = Buffer.from(payload, 'base64').toString('utf8');
            else if (typeof (globalThis as any).atob === 'function') {
              const bstr = (globalThis as any).atob(payload);
              try { decoded = decodeURIComponent(escape(bstr)); } catch (e) { decoded = bstr; }
            } else decoded = payload;
          } catch (e) { decoded = payload; }
          text = decoded;
        } else {
          try { text = decodeURIComponent(payload.replace(/\+/g, ' ')); } catch (e) { text = payload; }
        }
      }
      if (text && text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      const items = JSON.parse(text);
      if (!Array.isArray(items)) throw new Error('剪贴板内容不是商品数组');
      let added = 0, skipped = 0;
      for (const it of items) {
        const prodName = (it.name || '').toString().trim();
        if (!prodName) { skipped++; continue; }
        const existing = await getProductByName(prodName);
        if (existing) { skipped++; continue; }
        const product = { name: prodName, price: Number(it.price) || 0, location: it.location || '', createdAt: it.createdAt || new Date().toISOString() };
        await addProduct(product);
        added++;
      }
      await loadProducts();
      emit('ordersUpdated');
      emit('productsUpdated'); // 通知商品页面刷新
      showToast(`已从剪贴板导入 ${added} 条商品，跳过 ${skipped} 条`);
      loadStats();
    } catch (err) {
      console.error('剪贴板导入失败', err);
      Alert.alert('导入失败', String(err));
    } finally {
      setUrlLoading(false);
    }
  };

  const ensureAndroidReadPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      console.log('正在请求Android读取权限...');
      // 对于Android 11及以上版本，使用新的权限模型
      const permissions = Platform.Version >= 30 ? 
        [PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] :
        [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE];
      
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      console.log('权限请求结果:', granted);
      
      // 检查是否所有权限都被授予
      const allGranted = Object.values(granted).every(status => status === PermissionsAndroid.RESULTS.GRANTED);
      return allGranted;
    } catch (err: any) {
      console.warn('请求权限失败', err);
      return false;
    }
  };

  const ensureAndroidWritePermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      console.log('正在请求Android写入权限...');
      // 对于Android 11及以上版本，使用新的权限模型
      const permissions = Platform.Version >= 30 ? 
        [PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] :
        [PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE];
      
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      console.log('写入权限请求结果:', granted);
      
      // 检查是否所有权限都被授予
      const allGranted = Object.values(granted).every(status => status === PermissionsAndroid.RESULTS.GRANTED);
      return allGranted;
    } catch (err: any) {
      console.warn('请求写入权限失败', err);
      return false;
    }
  };



  const handleImport = async () => {
    try {
      console.log('开始导入流程...');
      
      // 检查安卓权限
      if (Platform.OS === 'android') {
        console.log('检测到Android平台，检查权限...');
        const hasPermission = await ensureAndroidReadPermission();
        if (!hasPermission) {
          Alert.alert('权限不足', '需要读取存储权限才能导入文件');
          return;
        }
        console.log('权限检查通过');
      }
      
      console.log('正在选择文件...');
      let res;
      try {
        res = await DocumentPicker.getDocumentAsync({ 
          type: 'application/json', 
          copyToCacheDirectory: true 
        });
      } catch (pickerError: any) {
        console.error('文件选择器错误:', pickerError);
        Alert.alert('文件选择失败', `无法打开文件选择器: ${pickerError?.message || String(pickerError)}`);
        return;
      }
      
      console.log('文件选择结果:', res);
      if (res.canceled) {
        console.log('用户取消了文件选择');
        return;
      }
      
      if (!res.assets || res.assets.length === 0) {
        console.log('没有选择任何文件');
        Alert.alert('未选择文件', '请选择要导入的JSON文件');
        return;
      }
      
      const uri = res.assets[0].uri;
      console.log('选择的文件URI:', uri);
      
      // 使用 FileSystem 读取文件内容
      let text = '';
      try {
        console.log('正在读取文件内容...');
        text = await FileSystem.readAsStringAsync(uri);
        console.log('文件读取成功，内容长度:', text.length);
      } catch (e: any) {
        console.error('文件读取失败:', e);
        throw new Error(`无法读取文件: ${e?.message || String(e)}`);
      }
      
      // 移除 BOM 字符
      if (text && text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
        console.log('移除了BOM字符');
      }
      
      console.log('正在解析JSON...');
      const items = JSON.parse(text);
      console.log('JSON解析成功，数据类型:', typeof items);
      
      if (!Array.isArray(items)) {
        Alert.alert('格式错误', '文件内容不是商品数组');
        return;
      }
      
      console.log('商品数组长度:', items.length);
      
      let added = 0;
      let skipped = 0;
      
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        try {
          const prodName = (it.name || '').toString().trim();
          if (!prodName) {
            console.log(`跳过第${i+1}条记录：商品名称为空`);
            skipped++;
            continue;
          }
          
          // 检查商品是否已存在
          const existing = await getProductByName(prodName);
          if (existing) {
            console.log(`跳过第${i+1}条记录：商品"${prodName}"已存在`);
            skipped++;
            continue;
          }
          
          const product = {
            name: prodName,
            price: Number(it.price) || 0,
            location: it.location || '',
            createdAt: it.createdAt || new Date().toISOString(),
          };
          
          await addProduct(product);
          added++;
          console.log(`成功添加商品：${prodName}`);
          
        } catch (itemErr: any) {
          console.error(`处理第${i+1}条记录时出错:`, itemErr);
          skipped++;
        }
      }
      
      console.log(`导入完成：成功添加${added}条，跳过${skipped}条`);
      
      await loadProducts();
      emit('ordersUpdated');
      emit('productsUpdated'); // 通知商品页面刷新
      showToast(`已导入 ${added} 条商品，跳过 ${skipped} 条`);
      loadStats();
      await loadHistory();
      
    } catch (err: any) {
      console.error('导入失败', err);
      Alert.alert('导入失败', err?.message || String(err));
    }
  };

  const handleCopyExportUrl = async () => {
    try {
      await Clipboard.setStringAsync(exportUrl);
      showToast('已复制到剪贴板');
    } catch (err) {
      console.error('复制失败', err);
      Alert.alert('错误', '复制失败');
    }
  };

  const handleShareExportUrl = async () => {
    try {
      await Share.share({ message: exportUrl });
    } catch (err) {
      console.error('分享失败', err);
      Alert.alert('错误', '分享失败');
    }
  };

  const handleClearAll = () => {
    Alert.alert('清空数据库', '确定要清空所有商品与订单吗？此操作不可恢复。', [
      { text: '取消', style: 'cancel' },
      { text: '清空', style: 'destructive', onPress: async () => {
        try {
          await clearProducts();
          await clearOrders();
          await getAllProducts();
          emit('ordersUpdated');
          showToast('已清空所有数据');
          loadStats();
        } catch (err) {
          console.error('清空失败', err);
          Alert.alert('错误', '清空失败');
        }
      } }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>数据管理</Text>

      <View style={styles.statRow}>
        <Text style={styles.statLabel}>商品数量</Text>
        <Text style={styles.statValue}>{productCount}</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>订单数量</Text>
        <Text style={styles.statValue}>{orderCount}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleOpenUrlModal}>
        <Text style={styles.buttonText}>从 URL 导入 JSON</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleImportFromClipboard}>
        <Text style={styles.buttonText}>从剪贴板导入</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleImport}>
        <Text style={styles.buttonText}>从文件导入（JSON）</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleExportToDataUrl}>
        <Text style={styles.buttonText}>导出为 URL（复制/分享）</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleExportToFile}>
        <Text style={styles.buttonText}>导出为文件并分享</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.danger]} onPress={handleClearAll}>
        <Text style={styles.buttonText}>清空所有数据</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: '#34C759' }]} onPress={() => {
        Alert.alert(
          '权限测试',
          '这将测试文件读写权限。点击确定开始测试。',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '确定', 
              onPress: async () => {
                try {
                  if (Platform.OS === 'android') {
                    const hasReadPermission = await ensureAndroidReadPermission();
                    const hasWritePermission = await ensureAndroidWritePermission();
                    
                    if (!hasReadPermission || !hasWritePermission) {
                      Alert.alert('权限不足', '请先授予文件读写权限');
                      return;
                    }
                  }

                  // 测试文件操作
                  const testFileName = `permission_test_${Date.now()}.txt`;
                  const testContent = '权限测试成功！';
                  const testPath = FileSystem.cacheDirectory + testFileName;
                  
                  await FileSystem.writeAsStringAsync(testPath, testContent);
                  const content = await FileSystem.readAsStringAsync(testPath);
                  await FileSystem.deleteAsync(testPath);
                  
                  Alert.alert('测试成功', `文件读写权限正常，内容: "${content}"`);
                } catch (err: any) {
                  console.error('权限测试失败:', err);
                  Alert.alert('测试失败', `权限测试失败: ${err.message}`);
                }
              }
            }
          ]
        );
      }}>
        <Text style={styles.buttonText}>测试文件权限</Text>
      </TouchableOpacity>

      <Modal visible={urlModalVisible} transparent animationType="fade" onRequestClose={() => setUrlModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>导入 JSON（URL）</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/products.json or data:..."
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            {urlLoading ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.smallButton, { marginRight: 8 }]} onPress={() => setUrlModalVisible(false)}>
                <Text style={styles.smallButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={handleImportFromUrlConfirm}>
                <Text style={styles.smallButtonText}>导入</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={exportUrlVisible} transparent animationType="fade" onRequestClose={() => setExportUrlVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>导出为 URL</Text>
            <TextInput style={[styles.input, { height: 120 }]} multiline value={exportUrl} editable={false} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.smallButton, { marginRight: 8 }]} onPress={() => setExportUrlVisible(false)}>
                <Text style={styles.smallButtonText}>关闭</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallButton, { marginRight: 8 }]} onPress={handleCopyExportUrl}>
                <Text style={styles.smallButtonText}>复制</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={handleShareExportUrl}>
                <Text style={styles.smallButtonText}>分享</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8 },
  statLabel: { color: '#666' },
  statValue: { fontWeight: '700' },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  danger: { backgroundColor: '#FF3B30' },
  buttonText: { color: 'white', fontWeight: '700' },
  smallButton: { backgroundColor: '#007AFF', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
  smallButtonText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', padding: 16, borderRadius: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
});