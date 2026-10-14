import { StyleSheet, View } from 'react-native';
import { SPINE_COLORS } from '../theme/colors';

interface BookStackIllustrationProps {
  books?: number;
  width?: number;
  seed?: number;
}

const SPINE_HEIGHT = 11;

export const BookStackIllustration = ({
  books = 6,
  width = 72,
  seed = 0,
}: BookStackIllustrationProps) => (
  <View
    style={styles.stack}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    {Array.from({ length: books }, (_, index) => {
      const variation = ((index + seed) * 37) % 18;
      const offset = ((index + seed) % 3) * 4 - 4;
      return (
        <View
          key={index}
          style={[
            styles.book,
            {
              width: width - variation,
              marginLeft: offset,
              backgroundColor: SPINE_COLORS[(index + seed) % SPINE_COLORS.length],
            },
          ]}
        >
          <View style={styles.band} />
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  stack: { alignItems: 'center', justifyContent: 'flex-end' },
  book: {
    height: SPINE_HEIGHT,
    borderRadius: 3,
    marginTop: 2,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  band: { height: 2, width: '30%', backgroundColor: 'rgba(247,242,232,0.55)', borderRadius: 1 },
});
