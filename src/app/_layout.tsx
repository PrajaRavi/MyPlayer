import { AudioPlayerProvider } from '@/context/AudioPlayerContext';
import { MediaProvider } from '@/context/MediaContext';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => { });

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after initialization
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => { });
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <MediaProvider>
        <AudioPlayerProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#090D16' },
              animation: 'slide_from_right',
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="player/video"
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
                animation: 'fade',
              }}
            />
          </Stack>
        </AudioPlayerProvider>
      </MediaProvider>
    </SafeAreaProvider>
  );
}
