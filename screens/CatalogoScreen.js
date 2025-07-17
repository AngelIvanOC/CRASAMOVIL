import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import CatalogoTemplate from "../components/templates/CatalogoTemplate";

const CatalogoScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <CatalogoTemplate navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

export default CatalogoScreen;
