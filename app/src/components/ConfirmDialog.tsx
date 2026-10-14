import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onDismiss: () => void;
  isProcessing?: boolean;
  destructive?: boolean;
}

export const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onDismiss,
  isProcessing = false,
  destructive = false,
}: ConfirmDialogProps) => {
  const theme = useAppTheme();
  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={isProcessing ? undefined : onDismiss}
        style={{ backgroundColor: theme.appColors.surface }}
      >
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onPress={onConfirm}
            loading={isProcessing}
            disabled={isProcessing}
            textColor={destructive ? theme.appColors.danger : undefined}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
