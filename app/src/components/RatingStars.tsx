import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

const STARS = [1, 2, 3, 4, 5];

export const RatingStars = ({ rating, size = 14 }: { rating: number; size?: number }) => {
  const theme = useAppTheme();
  return (
    <View style={styles.row} accessible accessibilityLabel={`Avaliação ${rating} de 5`}>
      {STARS.map((star) => (
        <MaterialCommunityIcons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color={theme.appColors.highlight}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 1 },
});
