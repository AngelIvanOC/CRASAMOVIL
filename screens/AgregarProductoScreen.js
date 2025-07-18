import React from "react";
import { View, StyleSheet } from "react-native";
import AgregarProductoTemplate from "../components/templates/AgregarProductoTemplate";

const AgregarProductoScreen = ({ route, navigation }) => {
  return (
    <View style={styles.container}>
      <AgregarProductoTemplate route={route} navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

export default AgregarProductoScreen;
