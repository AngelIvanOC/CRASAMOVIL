import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import SubirSueltoTemplate from "../components/templates/SubirSueltoTemplate";

const SubirSueltoScreen = ({ route, navigation }) => {
  const { producto, sueltoItem, rackSugerido, onUpdate } = route.params;

  useEffect(() => {
    navigation.setOptions({
      title: `Subir a Rack - ${producto.nombre}`,
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
      <SubirSueltoTemplate
        producto={producto}
        sueltoItem={sueltoItem}
        rackSugerido={rackSugerido}
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

export default SubirSueltoScreen;
