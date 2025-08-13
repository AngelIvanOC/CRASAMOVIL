import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { CameraView } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

const ValidacionRackQR = ({
  onQRRackEscaneado,
  rackEsperado,
  onCancel,
  resetScan = false,
  tipoUbicacion = "rack",
}) => {
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef(null);
  const alreadyHandledRef = useRef(false);

  useEffect(() => {
    if (resetScan) {
      console.log("Reseteando estado del scanner QR");
      setScanned(false);
      setProcessing(false);
      alreadyHandledRef.current = false;
    }
  }, [resetScan]);

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned || processing || alreadyHandledRef.current) {
      console.log("QR ignorado - ya procesando");
      return;
    }

    console.log("Procesando QR escaneado:", data);

    alreadyHandledRef.current = true;
    setScanned(true);
    setProcessing(true);

    onQRRackEscaneado(data);
  };

  const handleRetry = () => {
    setScanned(false);
    setProcessing(false);
    alreadyHandledRef.current = false;
  };

  const handleCancel = () => {
    setScanned(false);
    setProcessing(false);
    alreadyHandledRef.current = false;
    onCancel();
  };

  const getInstructionText = () => {
    if (tipoUbicacion === "suelto") {
      return "Escanea el código QR que dice 'SUELTO'";
    }
    if (tipoUbicacion === "piso") {
      return "Escanea el código QR que dice 'PISO'";
    }
    return `Escanea el código QR del rack: ${rackEsperado?.codigo_rack}`;
  };

  const getRackCode = () => {
    if (tipoUbicacion === "suelto") {
      return "SUELTO";
    }
    if (tipoUbicacion === "piso") {
      return "PISO";
    }
    return rackEsperado?.codigo_rack;
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {!scanned && (
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            ref={cameraRef}
          />
        )}

        {scanned && (
          <View style={styles.processingContainer}>
            <Text style={styles.processingText}>Validando código QR...</Text>
          </View>
        )}

        {!scanned && (
          <>
            <View style={styles.instructions}>
              <Text style={styles.instructionTitle}>
                {getInstructionText()}
              </Text>
              <Text style={styles.rackCode}> {getRackCode()}</Text>
            </View>

            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "black",
    zIndex: 1000,
  },
  container: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  processingText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  instructions: {
    position: "absolute",
    top: "20%",
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 20,
    borderRadius: 10,
    zIndex: 10,
  },
  instructionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  rackCode: {
    color: "#023E8A",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  scanFrame: {
    position: "absolute",
    top: "45%",
    left: "25%",
    width: "50%",
    height: "20%",
    zIndex: 10,
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#023E8A",
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  cancelButton: {
    position: "absolute",
    top: 50,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(220, 53, 69, 0.8)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    zIndex: 15,
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 5,
  },
});

export default ValidacionRackQR;
