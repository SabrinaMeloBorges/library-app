import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius } from '../theme/spacing';

interface BookCoverProps {
  uri: string | null;
  title: string;
  width?: number;
}

const COVER_RATIO = 1.5;

export const BookCover = ({ uri, title, width = 56 }: BookCoverProps) => {
  const theme = useAppTheme();
  const [failed, setFailed] = useState(false);
  const size = { width, height: Math.round(width * COVER_RATIO) };

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={[styles.cover, size, { backgroundColor: theme.appColors.surfaceMuted }]}
        accessibilityLabel={`Capa de ${title}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={[styles.cover, styles.placeholder, size, { backgroundColor: theme.appColors.primary }]}
      accessibilityLabel={`Sem capa disponível para ${title}`}
    >
      <MaterialCommunityIcons
        name="book-variant"
        size={Math.max(18, width * 0.35)}
        color={theme.appColors.onPrimary}
      />
      {width >= 80 ? (
        <Text
          variant="labelSmall"
          numberOfLines={3}
          style={[styles.placeholderTitle, { color: theme.appColors.onPrimary }]}
        >
          {title}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  cover: { borderRadius: radius.sm },
  placeholder: { alignItems: 'center', justifyContent: 'center', padding: 6, gap: 6 },
  placeholderTitle: { textAlign: 'center' },
});
