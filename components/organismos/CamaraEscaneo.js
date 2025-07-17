import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { CameraView } from "expo-camera";

const { width, height } = Dimensions.get("window");

const CamaraEscaneo = ({ onBarCodeScanned, scanning, scanned }) => {
  if (!scanning) {
    return (
      <View style={styles.cameraPlaceholder}>
        <Text style={styles.placeholderText}>
          Presiona "Iniciar Escaneo" para activar la cámara
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : onBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["code128", "ean13", "qr", "code39"],
        }}
      />

      {/* Overlay con marco de escaneo */}
      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer}>
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.focusedContainer}>
              <View style={styles.scanFrame}>
                {/* Esquinas del marco */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {/* Línea de escaneo animada */}
                <View style={styles.scanLine} />
              </View>
            </View>
            <View style={styles.unfocusedContainer} />
          </View>
        </View>

        {/* Instrucciones */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Coloca el código de barras dentro del marco
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d0d0d0",
    borderStyle: "dashed",
  },
  placeholderText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  unfocusedContainer: {
    flex: 1,
  },
  middleContainer: {
    flexDirection: "row",
    flex: 1.5,
  },
  focusedContainer: {
    flex: 6,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7 * 0.6, // Proporción rectangular para códigos de barras
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "#023E8A",
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    width: "100%",
    height: 2,
    backgroundColor: "#023E8A",
    position: "absolute",
    opacity: 0.8,
  },
  instructionsContainer: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    width: "80%",
    alignItems: "center",
  },
  instructionsText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
});

export default CamaraEscaneo;
