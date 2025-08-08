import React from "react";
import { View, StyleSheet } from "react-native";
import VentasTemplate from "../components/templates/VentasTemplate";

const VentasScreen = ({ route, navigation }) => {
  const marcaId = route?.params?.marcaId || null;

  return (
    <View style={styles.container}>
      <VentasTemplate marcaId={marcaId} navigation={navigation} route={route} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

export default VentasScreen;
