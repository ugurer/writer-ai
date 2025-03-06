import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

type Props = {
  message?: string;
};

export function LoadingOverlay({ message = 'Yükleniyor...' }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backdrop }]}>
      <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 16,
  },
  message: {
    marginTop: 8,
  },
}); 