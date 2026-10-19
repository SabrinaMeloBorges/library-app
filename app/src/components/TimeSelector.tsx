import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { formatTime } from '../utils/dates';
import { radius, spacing } from '../theme/spacing';

interface TimeSelectorProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  disabled?: boolean;
}

const MINUTE_STEP = 5;

const wrap = (value: number, size: number): number => ((value % size) + size) % size;

export const TimeSelector = ({ hour, minute, onChange, disabled = false }: TimeSelectorProps) => {
  const theme = useAppTheme();
  const shiftMinutes = (delta: number) => {
    const total = wrap(hour * 60 + minute + delta, 24 * 60);
    onChange(Math.floor(total / 60), total % 60);
  };

  return (
    <View
      style={[styles.container, { borderColor: theme.appColors.border }]}
      accessibilityLabel={`Horário selecionado: ${formatTime(hour, minute)}`}
    >
      <View style={styles.column}>
        <IconButton
          icon="chevron-up"
          disabled={disabled}
          onPress={() => shiftMinutes(60)}
          accessibilityLabel="Aumentar hora"
        />
        <IconButton
          icon="chevron-down"
          disabled={disabled}
          onPress={() => shiftMinutes(-60)}
          accessibilityLabel="Diminuir hora"
        />
      </View>
      <Text variant="displaySmall" style={{ color: theme.appColors.primary }}>
        {formatTime(hour, minute)}
      </Text>
      <View style={styles.column}>
        <IconButton
          icon="chevron-up"
          disabled={disabled}
          onPress={() => shiftMinutes(MINUTE_STEP)}
          accessibilityLabel="Aumentar minutos"
        />
        <IconButton
          icon="chevron-down"
          disabled={disabled}
          onPress={() => shiftMinutes(-MINUTE_STEP)}
          accessibilityLabel="Diminuir minutos"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
  },
  column: { alignItems: 'center' },
});
