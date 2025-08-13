import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView } from "expo-camera";

const { width, height } = Dimensions.get("window");

const CamaraEscaneo = ({
  onBarCodeScanned,
  scanning,
  scanned,
  onStartScanning,
  onCancelScanning,
  loading = false,
  onProductoDetectado,
}) => {
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    if (scanning && !scanned) {
      // Iniciar temporizador de 5 segundos cuando se activa el escaneo
      const timeout = setTimeout(() => {
        if (!scanned && onProductoDetectado) {
          Alert.alert(
            "No se pudo procesar la imagen",
            "¿Deseas ingresar manualmente?",
            [
              {
                text: "Cancelar",
                style: "cancel",
              },
              {
                text: "Entrada Manual",
                onPress: () => {
                  const productoManual = {
                    codigo: null,
                    descripcion: null,
                    fechaCaducidad: null,
                    codigoBarras: null,
                    cantidad: 1,
                  };
                  onProductoDetectado(productoManual);
                },
              },
            ]
          );
        }
      }, 7000); // 5 segundos

      setTimer(timeout);

      return () => clearTimeout(timeout);
    }
  }, [scanning, scanned, onProductoDetectado]);

  if (!scanning) {
    return (
      <View style={styles.cameraPlaceholder}>
        <Text style={styles.placeholderText}>
          Presiona el botón para activar la cámara
        </Text>

        <TouchableOpacity
          style={styles.startScanButton}
          onPress={onStartScanning}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.startScanButtonText}>INICIAR ESCANEO</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : onBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            "aztec",
            "ean13",
            "ean8",
            "qr",
            "pdf417",
            "upc_e",
            "datamatrix",
            "code39",
            "code93",
            "itf14",
            "codabar",
            "code128",
            "upc_a",
          ],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer}>
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.focusedContainer}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                <View style={styles.scanLine} />
              </View>
            </View>
            <View style={styles.unfocusedContainer} />
          </View>
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Coloca el código de barras dentro del marco
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancelScanning}
        >
          <Text style={styles.cancelButtonText}>CANCELAR</Text>
        </TouchableOpacity>
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
    position: "relative",
  },
  placeholderText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  startScanButton: {
    backgroundColor: "#023E8A",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  startScanButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
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
    height: width * 0.7 * 0.6,
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
    bottom: 80,
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
  cancelButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "rgba(220, 53, 69, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default CamaraEscaneo;
