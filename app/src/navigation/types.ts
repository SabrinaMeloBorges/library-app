import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CatalogBook } from '../services/catalogService';

export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Goals: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  BookDetails: { bookId: string };
  BookForm: { bookId?: string; catalogBook?: CatalogBook } | undefined;
  CatalogSearch: undefined;
  SessionForm: { userBookId: string; sessionId?: string };
  GoalForm: { goalId?: string } | undefined;
  Statistics: undefined;
  ReminderSettings: undefined;
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
