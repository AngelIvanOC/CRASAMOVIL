// ConfirmarPendienteScreen.js
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import ValidacionRackQR from "../components/organismos/ValidacionRackQR";
import { useProductos } from "../hooks/useProductos";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";

const ConfirmarPendienteScreen = ({ route, navigation }) => {
  const { pendiente } = route.params;
  const [esperandoValidacion, setEsperandoValidacion] = useState(false);
  const [resetQRScanner, setResetQRScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const { confirmarPendiente } = useProductos();

  const handleQRRackEscaneado = async (codigoQREscaneado) => {
    if (scanned) return;
    setScanned(true);

    if (codigoQREscaneado.toUpperCase() !== pendiente.ubicacion.toUpperCase()) {
      Alert.alert(
        "Ubicación incorrecta",
        `El código escaneado (${codigoQREscaneado}) no coincide con la ubicación asignada (${pendiente.ubicacion})`,
        [
          {
            text: "Reintentar",
            onPress: () => {
              setScanned(false);
              setResetQRScanner(true);
              setTimeout(() => {
                setResetQRScanner(false);
              }, 100);
            },
          },
        ]
      );
      return;
    }

    try {
      await confirmarPendiente(pendiente.id);
      Alert.alert("¡Éxito!", "El pendiente ha sido confirmado correctamente", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        `No se pudo confirmar el pendiente: ${error.message}`,
        [
          {
            text: "Reintentar",
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <MaterialIcons name="assignment" size={30} color="#023E8A" />
          <Text style={styles.headerSubtitle}>
            Escanea el código QR de la ubicación para confirmar
          </Text>
        </View>

        {/* Card del producto */}
        <View style={styles.productCard}>
          <View style={styles.productHeader}>
            <View style={styles.productTitleContainer}>
              <Text style={styles.productCode}>
                #{pendiente.productos?.codigo || "N/A"}
              </Text>
              <Text style={styles.productName}>
                {pendiente.productos?.nombre || "Producto sin nombre"}
              </Text>
            </View>
          </View>

          <View style={styles.productDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Codigo Barras</Text>
              <Text style={styles.codigoBarras}>{pendiente.codigo_barras}</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Cantidad</Text>
                <Text style={styles.detailValue}>{pendiente.cantidad}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Ubicación</Text>
                <View style={styles.locationBadge}>
                  <MaterialIcons name="place" size={16} color="#023E8A" />
                  <Text style={styles.locationText}>{pendiente.ubicacion}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Instrucciones */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Ve a la ubicación:{" "}
              <Text style={styles.boldText}>{pendiente.ubicacion}</Text>
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Presiona "Validar ubicación"
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Confirma y escanea el código QR
            </Text>
          </View>
        </View>

        {/* Botón de validación */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.validateButton}
            onPress={() => setEsperandoValidacion(true)}
          >
            <MaterialIcons name="qr-code-scanner" size={24} color="white" />
            <Text style={styles.validateButtonText}>Validar ubicación</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {esperandoValidacion && (
        <ValidacionRackQR
          onQRRackEscaneado={handleQRRackEscaneado}
          rackEsperado={{ codigo_rack: pendiente.ubicacion }}
          onCancel={() => setEsperandoValidacion(false)}
          resetScan={resetQRScanner}
          tipoUbicacion={pendiente.ubicacion === "SUELTO" ? "suelto" : "rack"}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerContainer: {
    backgroundColor: "white",
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  productCard: {
    backgroundColor: "white",
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#023E8A",
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  productTitleContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A202C",
    lineHeight: 22,
    marginBottom: 2,
  },
  productCode: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#023E8A",
  },
  productDetails: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 9,
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2ecc71",
  },
  codigoBarras: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 8,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f6ff",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d6e7ff",
  },
  locationText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#023E8A",
    marginLeft: 4,
  },
  instructionsContainer: {
    backgroundColor: "white",
    margin: 16,
    marginBottom: 4,
    borderRadius: 12,
    padding: 14,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#023E8A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: "#4A5568",
    lineHeight: 22,
  },
  boldText: {
    fontWeight: "600",
    color: "#023E8A",
  },
  buttonContainer: {
    margin: 16,
    marginTop: 8,
  },
  validateButton: {
    backgroundColor: "#023E8A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#023E8A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  validateButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
});

export default ConfirmarPendienteScreen;
