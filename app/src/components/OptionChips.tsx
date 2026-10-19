import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing } from '../theme/spacing';

export interface ChipOption<Value extends string> {
  value: Value;
  label: string;
  icon?: string;
}

interface OptionChipsProps<Value extends string> {
  options: ChipOption<Value>[];
  selected: Value | null;
  onSelect: (value: Value) => void;
  horizontal?: boolean;
  accessibilityLabel: string;
}

export const OptionChips = <Value extends string>({
  options,
  selected,
  onSelect,
  horizontal = false,
  accessibilityLabel,
}: OptionChipsProps<Value>) => {
  const theme = useAppTheme();
  const chips = options.map((option) => {
    const isSelected = option.value === selected;
    return (
      <Chip
        key={option.value}
        icon={option.icon}
        selected={isSelected}
        showSelectedOverlay
        onPress={() => onSelect(option.value)}
        accessibilityState={{ selected: isSelected }}
        style={[
          styles.chip,
          {
            backgroundColor: isSelected ? theme.appColors.surfaceMuted : 'transparent',
            borderColor: isSelected ? theme.appColors.accent : theme.appColors.border,
          },
        ]}
        textStyle={{ color: theme.appColors.text }}
      >
        {option.label}
      </Chip>
    );
  });

  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        accessibilityLabel={accessibilityLabel}
      >
        {chips}
      </ScrollView>
    );
  }
  return (
    <View style={[styles.row, styles.wrap]} accessibilityLabel={accessibilityLabel}>
      {chips}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
  wrap: { flexWrap: 'wrap' },
  chip: { borderWidth: 1 },
});
