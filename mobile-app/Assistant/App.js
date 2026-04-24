import React, { useState } from "react";
import HomeScreen from "./src/screens/HomeScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

export default function App() {
  const [activeScreen, setActiveScreen] = useState("home");

  if (activeScreen === "settings") {
    return <SettingsScreen onBack={() => setActiveScreen("home")} />;
  }

  return <HomeScreen onOpenSettings={() => setActiveScreen("settings")} />;
}
