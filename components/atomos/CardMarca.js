import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SvgUri } from "react-native-svg";

const { width: screenWidth } = Dimensions.get("window");

const CardMarca = ({ marca, onPress }) => {
  const [svgError, setSvgError] = useState(false);

  const handleSvgError = (error) => {
    console.log("SVG Error:", error);
    setSvgError(true);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(marca)}>
      <View style={styles.imageContainer}>
        {svgError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Logo no disponible</Text>
          </View>
        ) : (
          <SvgUri
            uri={marca.logo}
            width="100%"
            height="100%"
            onError={handleSvgError}
            style={styles.svg}
          />
        )}
      </View>
      <Text style={styles.nombre}>{marca.nombre}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 8,
    width: screenWidth * 0.9,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    minHeight: 100,
  },
  svg: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    width: "100%",
  },
  errorText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  nombre: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 8,
    color: "#333",
  },
});

export default CardMarca;
