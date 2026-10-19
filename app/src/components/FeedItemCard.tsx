import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import type { FeedActivity } from '../types/social';
import { TIER_LABELS, tierColor } from '../utils/achievements';
import { formatRelative } from '../utils/dates';
import { GOAL_TYPE_LABELS } from '../utils/labels';
import { radius, spacing } from '../theme/spacing';
import { AchievementBadge } from './AchievementBadge';
import { Avatar } from './Avatar';
import { BookCover } from './BookCover';
import { RatingStars } from './RatingStars';

interface FeedItemCardProps {
  activity: FeedActivity;
  onOpenUser: (userId: string) => void;
  onOpenComments: (activityId: string) => void;
  onToggleLike: (activity: FeedActivity) => void;
}

const describeAction = (activity: FeedActivity): string => {
  switch (activity.type) {
    case 'BOOK_STARTED':
      return 'começou a ler';
    case 'BOOK_FINISHED':
      return 'concluiu a leitura';
    case 'REVIEW_POSTED':
      return 'avaliou e resenhou';
    case 'GOAL_COMPLETED':
      return activity.goal?.isClubGoal ? 'ajudou o clube a bater uma meta' : 'bateu uma meta';
    case 'ACHIEVEMENT_UNLOCKED':
      return 'desbloqueou uma conquista';
  }
};

const FeedItemCardComponent = ({
  activity,
  onOpenUser,
  onOpenComments,
  onToggleLike,
}: FeedItemCardProps) => {
  const theme = useAppTheme();
  const { achievement, book, goal } = activity;
  const accentColor = achievement
    ? tierColor(achievement.tier, theme.appColors)
    : theme.appColors.border;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: achievement ? theme.appColors.surface : theme.appColors.highlightSoft,
          borderColor: accentColor,
          borderWidth: achievement ? 1.5 : 0,
        },
      ]}
    >
      <Pressable
        style={styles.header}
        onPress={() => onOpenUser(activity.user.id)}
        accessibilityRole="button"
        accessibilityLabel={`Ver perfil de ${activity.user.name}`}
      >
        <Avatar name={activity.user.name} seed={activity.user.id} size={36} />
        <View style={styles.headerText}>
          <Text variant="bodyMedium" numberOfLines={2}>
            <Text variant="titleSmall">{activity.user.name}</Text> {describeAction(activity)}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
            @{activity.user.username} · {formatRelative(activity.createdAt)}
          </Text>
        </View>
      </Pressable>

      {achievement ? (
        <View style={styles.achievement}>
          <AchievementBadge code={achievement.code} tier={achievement.tier} size={60} />
          <View style={styles.flex}>
            <Text variant="labelMedium" style={{ color: accentColor }}>
              Conquista {TIER_LABELS[achievement.tier]}
            </Text>
            <Text variant="titleLarge">{achievement.title}</Text>
            <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
              {achievement.description}
            </Text>
          </View>
        </View>
      ) : null}

      {book ? (
        <View style={styles.book}>
          <View style={styles.flex}>
            <Text variant="titleMedium" numberOfLines={2}>
              {book.title}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
              por {book.authors}
            </Text>
            {book.rating ? <RatingStars rating={book.rating} /> : null}
            {book.review ? (
              <Text variant="bodyMedium" numberOfLines={4} style={styles.review}>
                “{book.review}”
              </Text>
            ) : null}
          </View>
          <BookCover uri={book.coverUrl} title={book.title} width={58} />
        </View>
      ) : null}

      {goal ? (
        <View style={[styles.goal, { borderColor: theme.appColors.accent }]}>
          <Text variant="titleMedium">{goal.title}</Text>
          <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
            {GOAL_TYPE_LABELS[goal.type]} · meta de {goal.targetValue}
          </Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <IconButton
          icon={activity.likedByMe ? 'heart' : 'heart-outline'}
          iconColor={activity.likedByMe ? theme.appColors.danger : theme.appColors.text}
          size={20}
          onPress={() => onToggleLike(activity)}
          accessibilityLabel={activity.likedByMe ? 'Descurtir' : 'Curtir'}
          style={styles.iconButton}
        />
        <Text variant="bodySmall">{activity.likeCount}</Text>
        <IconButton
          icon="comment-outline"
          size={20}
          onPress={() => onOpenComments(activity.id)}
          accessibilityLabel="Comentários"
          style={styles.iconButton}
        />
        <Text variant="bodySmall">{activity.commentCount}</Text>
      </View>
    </View>
  );
};

export const FeedItemCard = memo(FeedItemCardComponent);

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerText: { flex: 1 },
  flex: { flex: 1, gap: 2 },
  achievement: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  book: { flexDirection: 'row', gap: spacing.md },
  review: { marginTop: spacing.xs, fontStyle: 'italic' },
  goal: { borderLeftWidth: 3, paddingLeft: spacing.md, gap: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -spacing.sm,
    marginBottom: -spacing.sm,
  },
  iconButton: { margin: 0 },
});
