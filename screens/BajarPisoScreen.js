import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import BajarPisoTemplate from "../components/templates/BajarPisoTemplate";

const BajarPisoScreen = ({ route, navigation }) => {
  const { producto, onUpdate } = route.params;

  useEffect(() => {
    navigation.setOptions({
      title: `Bajar a Piso - ${producto.nombre}`,
      headerStyle: {
        backgroundColor: "#023E8A",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    });
  }, [navigation, producto.nombre]);

  const handleScanComplete = async () => {
    try {
      if (onUpdate) {
        onUpdate();
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error in handleScanComplete:", error);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <BajarPisoTemplate
        producto={producto}
        navigation={navigation}
        onScanComplete={handleScanComplete}
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

export default BajarPisoScreen;
