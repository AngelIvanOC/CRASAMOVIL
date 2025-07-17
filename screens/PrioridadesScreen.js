import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import PrioridadesTemplate from "../components/templates/PrioridadesTemplate";

const PrioridadesScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <PrioridadesTemplate navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

export default PrioridadesScreen;
