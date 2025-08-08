import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import EscanearEntradaTemplate from "../components/templates/EscanearEntradaTemplate";

const EscanearEntradaScreen = ({ route, navigation }) => {
  const { onUpdate, marca } = route.params || {};

  useEffect(() => {
    navigation.setOptions({
      title: `Entrada - ${marca?.nombre || "Productos"}`,
      headerStyle: {
        backgroundColor: "#023E8A",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    });
  }, [navigation, marca]);

  const handleEntradaComplete = () => {
    if (onUpdate) {
      onUpdate();
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <EscanearEntradaTemplate
        navigation={navigation}
        marca={marca}
        onEntradaComplete={handleEntradaComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

export default EscanearEntradaScreen;
