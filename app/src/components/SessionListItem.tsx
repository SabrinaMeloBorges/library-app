import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import type { ReadingSession } from '../types/api';
import { formatDateTime, formatMinutes } from '../utils/dates';
import { spacing } from '../theme/spacing';

interface SessionListItemProps {
  session: ReadingSession;
  onEdit: (session: ReadingSession) => void;
  onDelete: (session: ReadingSession) => void;
  disabled?: boolean;
}

export const SessionListItem = ({
  session,
  onEdit,
  onDelete,
  disabled = false,
}: SessionListItemProps) => {
  const theme = useAppTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.appColors.border }]}>
      <View style={styles.content}>
        <Text variant="bodyMedium">
          Págs. {session.startPage}–{session.endPage} · {session.pagesRead} páginas
        </Text>
        <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
          {formatDateTime(session.readAt)} · {formatMinutes(session.durationMinutes)}
        </Text>
        {session.note ? (
          <Text variant="bodySmall" style={[styles.note, { color: theme.appColors.textMuted }]}>
            {session.note}
          </Text>
        ) : null}
      </View>
      <IconButton
        icon="pencil-outline"
        size={20}
        disabled={disabled}
        onPress={() => onEdit(session)}
        accessibilityLabel="Editar sessão"
      />
      <IconButton
        icon="trash-can-outline"
        size={20}
        disabled={disabled}
        onPress={() => onDelete(session)}
        accessibilityLabel="Excluir sessão"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: { flex: 1, gap: 2 },
  note: { fontStyle: 'italic' },
});
