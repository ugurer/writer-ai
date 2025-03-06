import React from 'react';
import { Portal, Dialog, Text } from 'react-native-paper';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  message: string;
};

export function ErrorDialog({
  visible,
  onDismiss,
  title = 'Hata',
  message,
}: Props) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text>{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Text onPress={onDismiss}>Tamam</Text>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
} 