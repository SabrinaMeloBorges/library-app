import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CatalogBook } from '../services/catalogService';
import type { ReadingStatus } from '../types/api';

export type MainTabParamList = {
  Home: undefined;
  Library: { status?: ReadingStatus } | undefined;
  Community: undefined;
  Goals: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  BookDetails: { bookId: string };
  BookForm: { bookId?: string; catalogBook?: CatalogBook } | undefined;
  CatalogSearch: { subject?: string; subjectLabel?: string } | undefined;
  SessionForm: { userBookId: string; sessionId?: string };
  GoalForm: { goalId?: string; clubId?: string } | undefined;
  Statistics: undefined;
  ReminderSettings: undefined;
  Settings: undefined;
  EditProfile: undefined;
  FindPeople: undefined;
  UserProfile: { userId: string };
  FollowList: { userId: string; mode: 'followers' | 'following' };
  ClubDetails: { clubId: string };
  ClubForm: { clubId?: string } | undefined;
  AddClubMembers: { clubId: string };
  Chat: { conversationId: string; title: string };
  ActivityComments: { activityId: string };
  Achievements: undefined;
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Screen
>;

export type MainTabScreenProps<Screen extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, Screen>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
