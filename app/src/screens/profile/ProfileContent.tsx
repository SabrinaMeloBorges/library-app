import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AchievementBadge } from '../../components/AchievementBadge';
import { BookListItem } from '../../components/BookListItem';
import { FeedItemCard } from '../../components/FeedItemCard';
import { ProfileHeader } from '../../components/ProfileHeader';
import { SectionHeader } from '../../components/SectionHeader';
import { ShelfCard } from '../../components/ShelfCard';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { ReadingStatus } from '../../types/api';
import type { FeedActivity, UserProfile } from '../../types/social';
import { spacing } from '../../theme/spacing';

interface ProfileContentProps {
  profile: UserProfile;
  activities: FeedActivity[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
  onOpenUser: (userId: string) => void;
  onOpenComments: (activityId: string) => void;
  onToggleLike: (activity: FeedActivity) => void;
  onOpenShelf?: (status: ReadingStatus) => void;
  onOpenBook?: (bookId: string) => void;
  onOpenAchievements?: () => void;
  headerActions?: ReactNode;
  topActions?: ReactNode;
  extraSection?: ReactNode;
}

const MAX_CONTENT_WIDTH = 640;

export const ProfileContent = ({
  profile,
  activities,
  isRefreshing,
  onRefresh,
  onOpenFollowers,
  onOpenFollowing,
  onOpenUser,
  onOpenComments,
  onToggleLike,
  onOpenShelf,
  onOpenBook,
  onOpenAchievements,
  headerActions,
  topActions,
  extraSection,
}: ProfileContentProps) => {
  const theme = useAppTheme();
  const { shelves } = profile;
  const muted = { color: theme.appColors.textMuted };

  return (
    <ScrollView
      style={{ backgroundColor: theme.appColors.background }}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={theme.appColors.primary}
          colors={[theme.appColors.primary]}
        />
      }
    >
      <ProfileHeader
        profile={profile}
        onOpenFollowers={onOpenFollowers}
        onOpenFollowing={onOpenFollowing}
        actions={headerActions}
        topActions={topActions}
      />
      <View style={styles.body}>
        <SectionHeader title={profile.relationship.isMe ? 'Suas estantes' : 'Estantes'} />
        <View style={styles.shelves}>
          <ShelfCard
            label="Lidos"
            count={shelves.FINISHED}
            color={theme.appColors.highlight}
            textColor={theme.appColors.background}
            onPress={onOpenShelf ? () => onOpenShelf('FINISHED') : undefined}
          />
          <ShelfCard
            label="Quero ler"
            count={shelves.WANT_TO_READ}
            color={theme.appColors.primary}
            textColor={theme.appColors.onPrimary}
            onPress={onOpenShelf ? () => onOpenShelf('WANT_TO_READ') : undefined}
          />
          <ShelfCard
            label="Lendo"
            count={shelves.READING}
            color={theme.appColors.accent}
            textColor={theme.appColors.background}
            onPress={onOpenShelf ? () => onOpenShelf('READING') : undefined}
          />
        </View>

        {extraSection}

        <SectionHeader
          title="Conquistas"
          subtitle={`${profile.stats.achievements} desbloqueadas`}
          action={
            onOpenAchievements ? (
              <Button compact onPress={onOpenAchievements}>
                Ver todas
              </Button>
            ) : undefined
          }
        />
        {profile.recentAchievements.length === 0 ? (
          <Text variant="bodyMedium" style={muted}>
            Nenhuma conquista ainda.
          </Text>
        ) : (
          <View style={styles.badges}>
            {profile.recentAchievements.map((achievement) => (
              <View
                key={achievement.code}
                style={styles.badge}
                accessible
                accessibilityLabel={achievement.title}
              >
                <AchievementBadge code={achievement.code} tier={achievement.tier} size={54} />
                <Text variant="labelSmall" numberOfLines={2} style={styles.badgeLabel}>
                  {achievement.title}
                </Text>
              </View>
            ))}
          </View>
        )}

        {profile.currentlyReading.length > 0 ? (
          <>
            <SectionHeader title="Lendo agora" />
            {profile.currentlyReading.map((item) => (
              <BookListItem key={item.id} item={item} onPress={onOpenBook ?? (() => undefined)} />
            ))}
          </>
        ) : null}

        <SectionHeader title="Atividades" />
        {activities.length === 0 ? (
          <Text variant="bodyMedium" style={muted}>
            Nenhuma atividade publicada ainda.
          </Text>
        ) : (
          activities.map((activity) => (
            <FeedItemCard
              key={activity.id}
              activity={activity}
              onOpenUser={onOpenUser}
              onOpenComments={onOpenComments}
              onToggleLike={onToggleLike}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl * 2 },
  body: {
    paddingHorizontal: spacing.lg,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  shelves: { flexDirection: 'row', gap: spacing.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  badge: { width: 72, alignItems: 'center', gap: spacing.xs },
  badgeLabel: { textAlign: 'center' },
});
