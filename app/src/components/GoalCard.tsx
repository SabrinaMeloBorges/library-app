import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import type { ReadingGoal } from '../types/api';
import { formatDateKey } from '../utils/dates';
import {
  GOAL_PERIOD_LABELS,
  GOAL_STATE_LABELS,
  GOAL_TYPE_LABELS,
  GOAL_UNITS,
} from '../utils/labels';
import { radius, spacing } from '../theme/spacing';
import { ReadingProgress } from './ReadingProgress';

interface GoalCardProps {
  goal: ReadingGoal;
  onEdit?: (goalId: string) => void;
  onDelete?: (goal: ReadingGoal) => void;
  isDeleting?: boolean;
}

export const GoalCard = ({ goal, onEdit, onDelete, isDeleting = false }: GoalCardProps) => {
  const theme = useAppTheme();
  const stateColor =
    goal.state === 'COMPLETED'
      ? theme.appColors.accent
      : goal.state === 'EXPIRED'
        ? theme.appColors.danger
        : theme.appColors.highlight;

  return (
    <View
      style={[
        styles.card,
        { borderColor: theme.appColors.border, backgroundColor: theme.appColors.surface },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text variant="titleMedium">{goal.title}</Text>
          <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
            {GOAL_TYPE_LABELS[goal.type]} · {GOAL_PERIOD_LABELS[goal.period]}
          </Text>
        </View>
        {onEdit ? (
          <IconButton
            icon="pencil-outline"
            size={20}
            onPress={() => onEdit(goal.id)}
            accessibilityLabel={`Editar meta ${goal.title}`}
          />
        ) : null}
        {onDelete ? (
          <IconButton
            icon="trash-can-outline"
            size={20}
            disabled={isDeleting}
            onPress={() => onDelete(goal)}
            accessibilityLabel={`Excluir meta ${goal.title}`}
          />
        ) : null}
      </View>
      <View style={styles.valueRow}>
        <Text variant="bodyMedium">
          {goal.currentValue} de {goal.targetValue} {GOAL_UNITS[goal.type]}
        </Text>
        <Text variant="labelMedium" style={{ color: stateColor }}>
          {GOAL_STATE_LABELS[goal.state]}
        </Text>
      </View>
      <ReadingProgress percentage={goal.percentage} label="Progresso" />
      <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
        {formatDateKey(goal.startDate)} – {formatDateKey(goal.endDate)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  titleBlock: { flex: 1, gap: 2 },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
