import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, Platform, PermissionsAndroid } from 'react-native';

// 类型声明
interface FileSystemModule {
  cacheDirectory: string;
  writeAsStringAsync: (fileUri: string, contents: string) => Promise<void>;
  readAsStringAsync: (fileUri: string) => Promise<string>;
  deleteAsync: (fileUri: string, options?: { idempotent?: boolean }) => Promise<void>;
}

const FileSystem = require('expo-file-system') as FileSystemModule;

export const PermissionTest: React.FC = () => {
  const [readPermission, setReadPermission] = useState<boolean | null>(null);
  const [writePermission, setWritePermission] = useState<boolean | null>(null);

  const checkPermissions = async () => {
    if (Platform.OS !== 'android') {
      setReadPermission(true);
      setWritePermission(true);
      return;
    }

    try {
      // 检查读取权限
      const readGranted = await PermissionsAndroid.check(
        Platform.Version >= 30 
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES 
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      setReadPermission(readGranted);

      // 检查写入权限
      const writeGranted = await PermissionsAndroid.check(
        Platform.Version >= 30 
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES 
          : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      setWritePermission(writeGranted);

    } catch (err) {
      console.error('检查权限失败:', err);
      Alert.alert('错误', '检查权限失败');
    }
  };

  const testFileOperations = async () => {
    try {
      const testFileName = `test_permission_${Date.now()}.txt`;
      const testContent = '权限测试文件内容';
      const testPath = FileSystem.cacheDirectory + testFileName;

      // 测试写入
      await FileSystem.writeAsStringAsync(testPath, testContent);
      console.log('文件写入成功:', testPath);

      // 测试读取
      const content = await FileSystem.readAsStringAsync(testPath);
      console.log('文件读取成功，内容:', content);

      // 清理测试文件
      await FileSystem.deleteAsync(testPath, { idempotent: true });
      console.log('测试文件已删除');

      Alert.alert('成功', '文件读写测试通过');
    } catch (err) {
      console.error('文件操作测试失败:', err);
      Alert.alert('失败', `文件操作测试失败: ${err}`);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        权限状态测试
      </Text>
      
      <Text style={{ marginBottom: 5 }}>
        读取权限: {readPermission === null ? '检查中...' : readPermission ? '✅ 已授予' : '❌ 未授予'}
      </Text>
      
      <Text style={{ marginBottom: 15 }}>
        写入权限: {writePermission === null ? '检查中...' : writePermission ? '✅ 已授予' : '❌ 未授予'}
      </Text>

      <Button title="重新检查权限" onPress={checkPermissions} />
      
      <View style={{ marginTop: 10 }}>
        <Button title="测试文件操作" onPress={testFileOperations} />
      </View>

      <Text style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
        Android版本: {Platform.Version}
        {'\n'}平台: {Platform.OS}
      </Text>
    </View>
  );
};