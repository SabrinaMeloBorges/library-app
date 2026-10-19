import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import type { UserProfile } from '../types/social';
import { fontFamilies, radius, spacing } from '../theme/spacing';
import { Avatar } from './Avatar';
import { BookStackIllustration } from './BookStackIllustration';

interface ProfileHeaderProps {
  profile: UserProfile;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
  actions?: ReactNode;
  topActions?: ReactNode;
}

const AVATAR_SIZE = 96;

const Stat = ({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress?: () => void;
}) => {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.stat}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
        {label}
      </Text>
      <Text style={styles.statValue}>{value}</Text>
    </Pressable>
  );
};

export const ProfileHeader = ({
  profile,
  onOpenFollowers,
  onOpenFollowing,
  actions,
  topActions,
}: ProfileHeaderProps) => {
  const theme = useAppTheme();
  const { user, stats } = profile;
  return (
    <View>
      <View style={[styles.hero, { backgroundColor: theme.appColors.hero }]}>
        <View style={styles.topActions}>{topActions}</View>
        <View style={styles.illustrations}>
          <BookStackIllustration books={7} width={78} seed={1} />
          <View style={{ width: AVATAR_SIZE }} />
          <BookStackIllustration books={6} width={70} seed={4} />
        </View>
      </View>
      <View style={[styles.sheet, { backgroundColor: theme.appColors.background }]}>
        <View style={styles.avatar}>
          <Avatar
            name={user.name}
            seed={user.id}
            size={AVATAR_SIZE}
            ringColor={theme.appColors.background}
          />
        </View>
        <Text variant="headlineSmall" style={styles.center} accessibilityRole="header">
          {user.name}
        </Text>
        <Text variant="bodyMedium" style={[styles.center, { color: theme.appColors.textMuted }]}>
          @{user.username}
        </Text>
        {user.bio ? (
          <Text variant="bodyMedium" style={[styles.center, styles.bio]}>
            {user.bio}
          </Text>
        ) : null}
        <View style={styles.stats}>
          <Stat label="Lidos" value={stats.booksFinished} />
          <Stat label="Seguindo" value={stats.following} onPress={onOpenFollowing} />
          <Stat label="Seguidores" value={stats.followers} onPress={onOpenFollowers} />
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    height: 170,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  topActions: { position: 'absolute', top: spacing.xs, right: spacing.xs, flexDirection: 'row' },
  illustrations: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sheet: {
    marginTop: -spacing.xl,
    borderTopLeftRadius: radius.lg * 2,
    borderTopRightRadius: radius.lg * 2,
    paddingTop: AVATAR_SIZE / 2 + spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  avatar: { position: 'absolute', top: -AVATAR_SIZE / 2 },
  center: { textAlign: 'center' },
  bio: { marginTop: spacing.xs, maxWidth: 420 },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
  stat: { alignItems: 'center', minWidth: 80 },
  statValue: { fontFamily: fontFamilies.bodySemiBold, fontSize: 22, lineHeight: 28 },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
