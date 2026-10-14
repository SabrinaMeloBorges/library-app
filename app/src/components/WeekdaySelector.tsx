import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { WEEKDAY_OPTIONS } from '../utils/labels';

interface WeekdaySelectorProps {
  selected: number[];
  onChange: (weekdays: number[]) => void;
  disabled?: boolean;
}

const SIZE = 40;

export const WeekdaySelector = ({ selected, onChange, disabled = false }: WeekdaySelectorProps) => {
  const theme = useAppTheme();
  const toggle = (day: number) => {
    const next = selected.includes(day)
      ? selected.filter((value) => value !== day)
      : [...selected, day];
    onChange(next.sort((a, b) => a - b));
  };

  return (
    <View style={styles.row}>
      {WEEKDAY_OPTIONS.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            disabled={disabled}
            onPress={() => toggle(option.value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected, disabled }}
            accessibilityLabel={option.label}
            style={[
              styles.day,
              {
                borderColor: isSelected ? theme.appColors.primary : theme.appColors.border,
                backgroundColor: isSelected ? theme.appColors.primary : 'transparent',
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <Text
              variant="labelLarge"
              style={{ color: isSelected ? theme.appColors.onPrimary : theme.appColors.text }}
            >
              {option.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
