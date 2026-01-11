import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export const Loading: React.FC<{ text?: string }> = ({ text }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#007AFF" />
    {text ? <Text style={styles.text}>{text}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 8,
    color: '#666',
  },
});

export default Loading;
