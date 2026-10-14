import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import type { ReadingStatus } from '../types/api';
import { STATUS_ICONS, STATUS_LABELS } from '../utils/labels';
import { radius, spacing } from '../theme/spacing';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const StatusBadge = ({ status }: { status: ReadingStatus }) => {
  const theme = useAppTheme();
  return (
    <View style={[styles.badge, { borderColor: theme.appColors.border }]}>
      <MaterialCommunityIcons
        name={STATUS_ICONS[status] as IconName}
        size={14}
        color={theme.appColors.highlight}
      />
      <Text variant="labelSmall" style={{ color: theme.appColors.highlight }}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});
