// EscanearCostenaScreen.js
import { View, StyleSheet } from "react-native";
import { useEffect } from "react";
import EscanearCostenaTemplate from "../components/templates/EscanearCostenaTemplate";

const EscanearCostenaScreen = ({ route, navigation }) => {
  const { onUpdate, marca } = route.params || {};

  useEffect(() => {
    navigation.setOptions({
      title: `Entrada - ${marca?.nombre || "JUMEX"}`,
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
    if (onUpdate) onUpdate();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <EscanearCostenaTemplate
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

export default EscanearCostenaScreen;
