import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AVATAR_COLORS, palette } from '../theme/colors';
import { fontFamilies } from '../theme/spacing';

interface AvatarProps {
  name: string;
  seed: string;
  size?: number;
  ringColor?: string;
}

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
};

const colorFor = (seed: string): string => {
  const hash = [...seed].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export const Avatar = ({ name, seed, size = 40, ringColor }: AvatarProps) => (
  <View
    style={[
      styles.circle,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colorFor(seed),
        borderWidth: ringColor ? Math.max(2, size / 20) : 0,
        borderColor: ringColor,
      },
    ]}
    accessibilityLabel={`Avatar de ${name}`}
  >
    <Text style={[styles.initials, { fontSize: size * 0.38, lineHeight: size * 0.48 }]}>
      {initialsOf(name)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: palette.beige, fontFamily: fontFamilies.bodySemiBold },
});
