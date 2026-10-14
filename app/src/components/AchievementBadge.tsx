import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import type { AchievementTier } from '../types/social';
import { achievementIcon, tierColor } from '../utils/achievements';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface AchievementBadgeProps {
  code: string;
  tier: AchievementTier;
  size?: number;
  locked?: boolean;
}

export const AchievementBadge = ({
  code,
  tier,
  size = 56,
  locked = false,
}: AchievementBadgeProps) => {
  const theme = useAppTheme();
  const color = locked ? theme.appColors.border : tierColor(tier, theme.appColors);
  return (
    <View
      style={[
        styles.outer,
        { width: size, height: size, borderRadius: size / 2, borderColor: color },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          styles.inner,
          {
            width: size - 10,
            height: size - 10,
            borderRadius: (size - 10) / 2,
            backgroundColor: locked ? theme.appColors.surfaceMuted : color,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={(locked ? 'lock-outline' : achievementIcon(code)) as IconName}
          size={size * 0.42}
          color={locked ? theme.appColors.textMuted : theme.appColors.onHero}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  inner: { alignItems: 'center', justifyContent: 'center' },
});
