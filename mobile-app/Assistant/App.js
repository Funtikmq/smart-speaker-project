import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from "./src/screens/HomeScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

export default function App() {
  const [activeScreen, setActiveScreen] = useState("home");

  return (
    <SafeAreaProvider>
      {activeScreen === "settings" ? (
        <SettingsScreen onBack={() => setActiveScreen("home")} />
      ) : (
        <HomeScreen onOpenSettings={() => setActiveScreen("settings")} />
      )}
    </SafeAreaProvider>
  );
}
