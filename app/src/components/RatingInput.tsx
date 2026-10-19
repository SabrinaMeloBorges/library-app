import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';

interface RatingInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

const STARS = [1, 2, 3, 4, 5];

export const RatingInput = ({ value, onChange, disabled = false }: RatingInputProps) => {
  const theme = useAppTheme();
  return (
    <View
      style={styles.row}
      accessibilityRole="adjustable"
      accessibilityLabel={`Avaliação: ${value ?? 0} de 5`}
    >
      {STARS.map((star) => {
        const filled = value !== null && star <= value;
        return (
          <IconButton
            key={star}
            icon={filled ? 'star' : 'star-outline'}
            iconColor={theme.appColors.highlight}
            size={26}
            disabled={disabled}
            onPress={() => onChange(value === star ? null : star)}
            accessibilityLabel={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
            style={styles.star}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  star: { margin: 0 },
});
