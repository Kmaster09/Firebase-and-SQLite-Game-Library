
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '../styles/theme';

import {
  getGames,
  addGame,
  updateGame,
  deleteGame,
} from '../services/gameRepository';

import {
  saveGameLocally,
  getLocalGames,
} from '../services/sqliteGames';

const genres = [
  'All',
  'Action',
  'Adventure',
  'Fighting',
  'Racing',
  'RPG',
  'Shooter',
  'Sports',
];

export default function LibraryScreen() {
  const router = useRouter();

  const [games, setGames] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [updatingIds, setUpdatingIds] = useState([]);

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Action');
  const [platform, setPlatform] = useState('PC');
  const [coverUrl, setCoverUrl] = useState('');

  const [sqliteBusy, setSqliteBusy] = useState(false);
  const [sqliteMessage, setSqliteMessage] = useState('');
  const [localGames, setLocalGames] = useState([]);

  // FIREBASE READ
  const loadGames = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const results = await getGames();
      setGames(results);
    } catch (error) {
      console.error('Firebase load failed:', error);
      setErrorMessage(error.message || 'Unable to load games.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // FIREBASE CREATE
  const handleAddGame = async () => {
    if (!title.trim()) {
      setErrorMessage('Please enter a game title.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const newGame = {
        title: title.trim(),
        genre,
        platform: platform.trim() || 'PC',
        status: 'Backlog',
        rating: 0,
        favorite: false,
        coverUrl: coverUrl.trim(),
      };

      const savedGame = await addGame(newGame);

      setGames((current) => [...current, savedGame]);
      setTitle('');
      setCoverUrl('');
    } catch (error) {
      console.error('Firebase add failed:', error);
      setErrorMessage(error.message || 'Unable to add game.');
    } finally {
      setIsSaving(false);
    }
  };

  // FIREBASE UPDATE
  const handleToggleFavorite = async (game) => {
    if (updatingIds.includes(game.id)) return;

    const newFavorite = !game.favorite;
    setErrorMessage('');
    setUpdatingIds((current) => [...current, game.id]);

    try {
      await updateGame(game.id, {
        favorite: newFavorite,
      });

      setGames((current) =>
        current.map((item) =>
          item.id === game.id
            ? { ...item, favorite: newFavorite }
            : item
        )
      );
    } catch (error) {
      console.error('Firebase update failed:', error);
      setErrorMessage(
        error.message || 'Unable to update favorite.'
      );
    } finally {
      setUpdatingIds((current) =>
        current.filter((id) => id !== game.id)
      );
    }
  };

  // FIREBASE DELETE
  const handleDeleteGame = async (game) => {
    if (updatingIds.includes(game.id)) return;

    setErrorMessage('');
    setUpdatingIds((current) => [...current, game.id]);

    try {
      await deleteGame(game.id);

      setGames((current) =>
        current.filter((item) => item.id !== game.id)
      );
    } catch (error) {
      console.error('Firebase delete failed:', error);
      setErrorMessage(error.message || 'Unable to delete game.');
    } finally {
      setUpdatingIds((current) =>
        current.filter((id) => id !== game.id)
      );
    }
  };

  // SQLITE SAVE
  const handleSaveToSQLite = async () => {
    if (sqliteBusy || isLoading) return;

    setSqliteBusy(true);
    setSqliteMessage('');
    setErrorMessage('');

    try {
      if (games.length === 0) {
        setSqliteMessage('There are no games to save.');
        return;
      }

      for (const game of games) {
        await saveGameLocally(game);
      }

      setSqliteMessage(
        `${games.length} games saved to SQLite successfully!`
      );

      if (Platform.OS !== 'web') {
        Alert.alert(
          'SQLite Save',
          `${games.length} games saved successfully!`
        );
      }
    } catch (error) {
      console.error('SQLite save failed:', error);
      setErrorMessage(
        error.message || 'Unable to save games to SQLite.'
      );
    } finally {
      setSqliteBusy(false);
    }
  };

  // SQLITE LOAD
  const handleLoadFromSQLite = async () => {
    if (sqliteBusy) return;

    setSqliteBusy(true);
    setSqliteMessage('');
    setErrorMessage('');

    try {
      const results = await getLocalGames();

      setLocalGames(results);

      setSqliteMessage(
        `${results.length} games loaded from SQLite successfully!`
      );

      console.log('SQLite games:', results);

      if (Platform.OS !== 'web') {
        Alert.alert(
          'SQLite Load',
          `${results.length} games loaded successfully!`
        );
      }
    } catch (error) {
      console.error('SQLite load failed:', error);
      setErrorMessage(
        error.message || 'Unable to load games from SQLite.'
      );
    } finally {
      setSqliteBusy(false);
    }
  };

  // SEARCH AND GENRE FILTERS
  const filteredGames = games.filter((game) => {
    const matchesSearch = (game.title || '')
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesGenre =
      selectedGenre === 'All' ||
      game.genre === selectedGenre;

    return matchesSearch && matchesGenre;
  });

  // GAME CARD
  const renderGame = ({ item }) => {
    const isUpdating = updatingIds.includes(item.id);

    return (
      <View style={styles.gameCard}>
        {item.coverUrl ? (
          <Image
            source={{ uri: item.coverUrl }}
            style={styles.cover}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cover, styles.noCover]}>
            <Text style={styles.noCoverText}>
              NO COVER
            </Text>
          </View>
        )}

        <View style={styles.gameInfo}>
          <Text style={styles.gameTitle}>
            {item.title}
          </Text>

          <Text style={styles.gameDetails}>
            {item.genre} • {item.platform}
          </Text>

          <Text style={styles.gameDetails}>
            {item.status} • Rating: {item.rating ?? 0}
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={[
                styles.actionButton,
                item.favorite && styles.favoriteButton,
                isUpdating && styles.disabledButton,
              ]}
              onPress={() => handleToggleFavorite(item)}
              disabled={isUpdating}
            >
              <Text style={styles.actionText}>
                {isUpdating
                  ? 'Saving...'
                  : item.favorite
                    ? '★ Favorited'
                    : '☆ Favorite'}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.actionButton,
                styles.deleteButton,
                isUpdating && styles.disabledButton,
              ]}
              onPress={() => handleDeleteGame(item)}
              disabled={isUpdating}
            >
              <Text style={styles.actionText}>
                Delete
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={isLoading ? [] : filteredGames}
        keyExtractor={(item) => item.id}
        renderItem={renderGame}
        extraData={updatingIds}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            {/* BACK TO HOME */}
            <Pressable
              style={styles.backButton}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.backButtonText}>
                ← Back to Home
              </Text>
            </Pressable>

            <Text style={styles.eyebrow}>
              CLOUD LIBRARY
            </Text>

            <Text style={styles.title}>
              Cloud Game Collection
            </Text>

            <Text style={styles.subtitle}>
              Manage your games with Firebase Cloud Firestore
              and local SQLite storage.
            </Text>

            {/* SEARCH */}
            <TextInput
              style={styles.input}
              placeholder="Search games..."
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
            />

            {/* GENRE FILTERS */}
            <View style={styles.genreRow}>
              {genres.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.genreButton,
                    selectedGenre === item &&
                      styles.activeGenre,
                  ]}
                  onPress={() => setSelectedGenre(item)}
                >
                  <Text style={styles.genreText}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* ADD GAME */}
            <View style={styles.form}>
              <Text style={styles.sectionTitle}>
                Add a Game
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Game title"
                placeholderTextColor={colors.muted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>
                Genre
              </Text>

              <View style={styles.genreRow}>
                {genres.slice(1).map((item) => (
                  <Pressable
                    key={item}
                    style={[
                      styles.genreButton,
                      genre === item &&
                        styles.activeGenre,
                    ]}
                    onPress={() => setGenre(item)}
                  >
                    <Text style={styles.genreText}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Platform (PC, PlayStation, Xbox...)"
                placeholderTextColor={colors.muted}
                value={platform}
                onChangeText={setPlatform}
              />

              <TextInput
                style={styles.input}
                placeholder="Direct cover image URL"
                placeholderTextColor={colors.muted}
                value={coverUrl}
                onChangeText={setCoverUrl}
                autoCapitalize="none"
              />

              <Pressable
                style={[
                  styles.addButton,
                  isSaving && styles.disabledButton,
                ]}
                onPress={handleAddGame}
                disabled={isSaving}
              >
                <Text style={styles.addButtonText}>
                  {isSaving ? 'Saving...' : '+ Add Game'}
                </Text>
              </Pressable>
            </View>

            {/* SQLITE */}
            <View style={styles.sqliteSection}>
              <Text style={styles.sectionTitle}>
                Local SQLite Storage
              </Text>

              <Text style={styles.sqliteDescription}>
                Save your Firebase games locally and read
                them back from the device database.
              </Text>

              <View style={styles.sqliteButtons}>
                <Pressable
                  style={[
                    styles.sqliteButton,
                    sqliteBusy && styles.disabledButton,
                  ]}
                  onPress={handleSaveToSQLite}
                  disabled={sqliteBusy || isLoading}
                >
                  <Text style={styles.sqliteButtonText}>
                    {sqliteBusy
                      ? 'Working...'
                      : 'Save to SQLite'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.sqliteButton,
                    sqliteBusy && styles.disabledButton,
                  ]}
                  onPress={handleLoadFromSQLite}
                  disabled={sqliteBusy}
                >
                  <Text style={styles.sqliteButtonText}>
                    {sqliteBusy
                      ? 'Working...'
                      : 'Load from SQLite'}
                  </Text>
                </Pressable>
              </View>

              {!!sqliteMessage && (
                <Text style={styles.sqliteSuccess}>
                  {sqliteMessage}
                </Text>
              )}

              <Text style={styles.localCount}>
                Local games loaded: {localGames.length}
              </Text>

              {localGames.length > 0 && (
                <View style={styles.localList}>
                  {localGames.map((game) => (
                    <Text
                      key={game.id}
                      style={styles.localGameText}
                    >
                      • {game.title}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* MY GAMES */}
            <View style={styles.libraryHeader}>
              <Text style={styles.sectionTitle}>
                My Games ({filteredGames.length})
              </Text>

              <Pressable
                onPress={loadGames}
                disabled={isLoading}
              >
                <Text style={styles.refreshText}>
                  Refresh
                </Text>
              </Pressable>
            </View>

            {!!errorMessage && (
              <View style={styles.messageCard}>
                <Text style={styles.errorText}>
                  {errorMessage}
                </Text>
              </View>
            )}

            {isLoading && (
              <View style={styles.messageCard}>
                <ActivityIndicator color={colors.accent} />
                <Text style={styles.subtitle}>
                  Loading games...
                </Text>
              </View>
            )}

            {!isLoading &&
              filteredGames.length === 0 && (
                <View style={styles.messageCard}>
                  <Text style={styles.subtitle}>
                    No games found.
                  </Text>
                </View>
              )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    padding: 26,
    paddingBottom: 70,
  },

  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#244C78',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 20,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },

  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    marginTop: 8,
  },

  subtitle: {
    color: colors.muted,
    marginTop: 10,
    marginBottom: 15,
    fontSize: 15,
  },

  input: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    marginTop: 12,
    fontSize: 14,
  },

  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
    marginBottom: 15,
  },

  genreButton: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  activeGenre: {
    backgroundColor: colors.accent,
  },

  genreText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 12,
  },

  form: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },

  label: {
    color: colors.text,
    fontWeight: '700',
    marginTop: 15,
  },

  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },

  addButtonText: {
    color: '#071009',
    fontWeight: '900',
  },

  sqliteSection: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
  },

  sqliteDescription: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 10,
  },

  sqliteButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    flexWrap: 'wrap',
  },

  sqliteButton: {
    backgroundColor: '#244C78',
    padding: 14,
    borderRadius: 10,
  },

  sqliteButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  sqliteSuccess: {
    color: '#5DD66B',
    fontWeight: '800',
    marginTop: 16,
  },

  localCount: {
    color: colors.text,
    fontWeight: '700',
    marginTop: 16,
  },

  localList: {
    marginTop: 10,
    gap: 6,
  },

  localGameText: {
    color: colors.muted,
    fontSize: 13,
  },

  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },

  refreshText: {
    color: colors.accent,
    fontWeight: '800',
  },

  gameCard: {
    flexDirection: 'row',
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 16,
  },

  cover: {
    width: 100,
    height: 140,
    borderRadius: 8,
    backgroundColor: colors.border,
  },

  noCover: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  noCoverText: {
    color: colors.muted,
    fontSize: 10,
  },

  gameInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  gameTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
  },

  gameDetails: {
    color: colors.muted,
    marginTop: 7,
    fontSize: 13,
  },

  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
  },

  actionButton: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },

  favoriteButton: {
    backgroundColor: '#245C35',
    borderColor: '#5DD66B',
  },

  deleteButton: {
    backgroundColor: '#642626',
  },

  disabledButton: {
    opacity: 0.6,
  },

  actionText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 12,
  },

  messageCard: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 25,
    marginVertical: 15,
    alignItems: 'center',
    gap: 12,
  },

  errorText: {
    color: '#FF7777',
    textAlign: 'center',
  },
});
