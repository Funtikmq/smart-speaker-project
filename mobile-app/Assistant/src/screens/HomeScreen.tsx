import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppIcon, { AppIconName } from '../components/AppIcon';
import { RootStackParamList } from '../navigation/types';

type HomeNavigation = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type MenuItem = {
  screen: Exclude<keyof RootStackParamList, 'Home'>;
  title: string;
  subtitle: string;
  icon: AppIconName;
};

const menuItems: MenuItem[] = [
  {
    screen: 'Agent',
    title: 'Agent AI',
    subtitle: 'Comenzi vocale si interactiune inteligenta',
    icon: 'agent',
  },

  {
    screen: 'Settings',
    title: 'Setari',
    subtitle: 'Ajusteaza comportamentul aplicatiei',
    icon: 'settings',
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigation>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PiBox Assistant</Text>
      <Text style={styles.subtitle}>Meniu principal</Text>

      <View style={styles.menuList}>
        {menuItems.map(item => (
          <Pressable
            key={item.screen}
            style={({ pressed }) => [
              styles.menuCard,
              pressed && styles.menuCardPressed,
            ]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={styles.iconWrap}>
              <AppIcon name={item.icon} />
            </View>

            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#4fc3f7',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#9ba4c7',
    marginBottom: 20,
  },

  menuList: {
    gap: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#22335f',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  menuCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#13243f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    color: '#e8f1ff',
    fontSize: 18,
    fontWeight: '600',
  },
  menuSubtitle: {
    color: '#9ba4c7',
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    color: '#4fc3f7',
    fontSize: 26,
    lineHeight: 26,
    paddingHorizontal: 4,
  },
});
