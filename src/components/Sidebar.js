
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../styles/theme';

const navigationItems = [
  {
    label: 'Home',
    icon: 'home-outline',
    route: '/',
  },
  {
    label: 'Library',
    icon: 'library-outline',
    route: '/library',
  },
  {
    label: 'Friends',
    icon: 'people-outline',
    route: '/friends',
  },
  {
    label: 'Recent',
    icon: 'time-outline',
    route: '/recent',
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const navigateTo = (route) => {
    if (pathname !== route) {
      router.push(route);
    }
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <Ionicons
          name="cloud"
          size={26}
          color={colors.accent}
        />

        <Text style={styles.brandText}>
          CLOUD ARC
        </Text>
      </View>

      <View style={styles.navigation}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.route;

          return (
            <Pressable
              key={item.label}
              onPress={() => navigateTo(item.route)}
              style={[
                styles.navItem,
                isActive && styles.activeNav,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={21}
                color={
                  isActive
                    ? colors.text
                    : colors.muted
                }
              />

              <Text
                style={[
                  styles.navText,
                  isActive && styles.activeText,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.onlineSection}>
        <Text style={styles.onlineTitle}>
          ONLINE NOW
        </Text>

        <View style={styles.friendsRow}>
          {['JD', 'KT', 'RM'].map((friend) => (
            <View
              key={friend}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {friend}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.onlineCount}>
          3 friends online
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: colors.panel,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    padding: 22,
    minHeight: '100%',
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 35,
  },

  brandText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  navigation: {
    gap: 8,
  },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 17,
    borderRadius: 10,
  },

  activeNav: {
    backgroundColor: '#20242D',
  },

  navText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '800',
  },

  activeText: {
    color: colors.text,
  },

  onlineSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 45,
    paddingTop: 24,
  },

  onlineTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  friendsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 15,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#303846',
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },

  onlineCount: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 13,
    marginTop: 12,
  },
});
