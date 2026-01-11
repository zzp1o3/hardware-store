import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const EmptyState: React.FC<{ icon?: string; title?: string; subtitle?: string }> = ({ icon = '📭', title = '暂无内容', subtitle }) => (
  <View style={styles.container}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 16, color: '#333' },
  subtitle: { marginTop: 6, color: '#888' },
});

export default EmptyState;
