import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useCameraPermissions } from "expo-camera";
import CamaraEscaneo from "../organismos/CamaraEscaneo";
import { supabase } from "../../supabase/supabase";
import CustomAlert from "../atomos/Alertas/CustomAlert";
import ValidacionRackQR from "../organismos/ValidacionRackQR";

const SubirSueltoTemplate = ({
  producto,
  sueltoItem,
  rackSugerido,
  navigation,
  onScanComplete,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [esperandoValidacionRack, setEsperandoValidacionRack] = useState(false);
  const [resetQRScanner, setResetQRScanner] = useState(false);
  const alreadyHandledRef = useRef(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertProps, setAlertProps] = useState({
    title: "",
    message: "",
    buttons: [],
  });

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const showAlert = ({ title, message, buttons = [] }) => {
    setAlertProps({ title, message, buttons });
    setAlertVisible(true);

    if (buttons.length === 0) {
      setTimeout(() => {
        setAlertVisible(false);
      }, 4000);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES");
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (data.length < 10) {
      console.log("Código ignorado por longitud:", data);
      return;
    }

    if (alreadyHandledRef.current || scanned) return;

    alreadyHandledRef.current = true;
    setScanned(true);
    setScanning(false);

    setTimeout(() => {
      alreadyHandledRef.current = false;
    }, 4000);

    const scannedCode = data.trim();

    console.log("[DEBUG] Código escaneado:", scannedCode);
    console.log("[DEBUG] Código esperado:", sueltoItem.codigo_barras);

    // Verificar que el código escaneado coincida con la caja seleccionada
    if (scannedCode !== sueltoItem.codigo_barras) {
      showAlert({
        title: "Código incorrecto",
        message: `Este código no coincide con la caja seleccionada.\n\nEscaneado: ${scannedCode}\nEsperado: ${sueltoItem.codigo_barras}`,
        buttons: [
          {
            text: "Reintentar",
            onPress: () => {
              setAlertVisible(false);
              setScanned(false);
            },
          },
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => setAlertVisible(false),
          },
        ],
      });
      return;
    }

    // Código correcto, mostrar confirmación y proceder a validación de rack
    showAlert({
      title: "¡Código Validado!",
      message: `Código de barras confirmado.\n\nAhora escanea el código QR del rack ${rackSugerido.codigo_rack} donde debes colocar esta caja.`,
      buttons: [
        {
          text: "Cancelar",
          onPress: () => {
            setAlertVisible(false);
            setScanned(false);
          },
          style: "cancel",
        },
        {
          text: "Continuar",
          onPress: () => {
            setAlertVisible(false);
            setEsperandoValidacionRack(true);
          },
        },
      ],
    });
  };

  const handleQRRackEscaneado = (codigoQREscaneado) => {
    // Comparar el código escaneado con el rack sugerido
    if (codigoQREscaneado === rackSugerido.codigo_rack) {
      // Código correcto, proceder con el movimiento
      showAlert({
        title: "¡Rack Validado!",
        message: `¿Confirmas mover ${sueltoItem.cantidad} unidades de ${producto.nombre} al rack ${rackSugerido.codigo_rack}?`,
        buttons: [
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => {
              setAlertVisible(false);
              setEsperandoValidacionRack(false);
            },
          },
          {
            text: "Confirmar",
            onPress: async () => {
              setAlertVisible(false);
              setEsperandoValidacionRack(false);
              await handleMoverARack();
            },
          },
        ],
      });
    } else {
      // Código incorrecto
      showAlert({
        title: "Rack Incorrecto",
        message: `El código escaneado (${codigoQREscaneado}) no coincide con el rack asignado (${rackSugerido.codigo_rack}). Por favor, escanea el código QR del rack correcto.`,
        buttons: [
          {
            text: "Reintentar",
            onPress: () => {
              setAlertVisible(false);
              setResetQRScanner(true);
              setTimeout(() => setResetQRScanner(false), 100);
            },
          },
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => {
              setAlertVisible(false);
              setEsperandoValidacionRack(false);
            },
          },
        ],
      });
    }
  };

  const handleMoverARack = async () => {
    try {
      setUpdating(true);

      // Usar la función SQL para mover de suelto a rack
      const { data, error } = await supabase.rpc("mover_suelto_a_rack", {
        suelto_id: sueltoItem.id,
        rack_id: rackSugerido.id,
      });

      if (error) {
        console.error("Error al mover a rack:", error);
        showAlert({
          title: "Error",
          message: "No se pudo mover el producto al rack",
          buttons: [
            {
              text: "OK",
              onPress: () => setAlertVisible(false),
            },
          ],
        });
        setScanned(false);
        return;
      }

      showAlert({
        title: "¡Éxito!",
        message: `Se movieron ${sueltoItem.cantidad} unidades al rack ${rackSugerido.codigo_rack} correctamente.`,
        buttons: [
          {
            text: "OK",
            onPress: () => {
              setAlertVisible(false);
              onScanComplete?.();
            },
          },
        ],
      });
    } catch (error) {
      console.error("Error moviendo a rack:", error);
      showAlert({
        title: "Error",
        message: error.message || "Error desconocido al mover la caja.",
        buttons: [
          {
            text: "OK",
            onPress: () => {
              setAlertVisible(false);
              setScanned(false);
            },
          },
        ],
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#023E8A" />
        <Text style={styles.loadingText}>
          Solicitando permisos de cámara...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          No se tiene acceso a la cámara. Por favor, habilita los permisos.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            requestPermission();
          }}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Info del producto y caja seleccionada */}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{producto.nombre}</Text>
        <Text style={styles.productCode}>Código: {producto.codigo}</Text>
        <View style={styles.separator} />
        <Text style={styles.sectionTitle}>Caja seleccionada:</Text>
        <Text style={styles.cajaInfo}>📦 Cantidad: {sueltoItem.cantidad}</Text>
        <Text style={styles.cajaInfo}>
          📅 Caduca: {formatDate(sueltoItem.fecha_caducidad)}
        </Text>
        <Text style={styles.cajaInfo}>
          🏷️ Código: {sueltoItem.codigo_barras}
        </Text>
        <View style={styles.separator} />
        <Text style={styles.sectionTitle}>Destino:</Text>
        <Text style={styles.rackInfo}>🎯 Rack: {rackSugerido.codigo_rack}</Text>
        <View style={styles.separator} />
        <Text style={styles.instruction}>
          {!esperandoValidacionRack
            ? "Escanea el código de barras de la caja seleccionada"
            : "Escanea el código QR del rack destino"}
        </Text>
      </View>

      {/* Validación de rack QR */}
      {esperandoValidacionRack && (
        <ValidacionRackQR
          onQRRackEscaneado={handleQRRackEscaneado}
          rackEsperado={rackSugerido}
          onCancel={() => setEsperandoValidacionRack(false)}
          resetScan={resetQRScanner}
          tipoUbicacion="rack"
        />
      )}

      {/* Cámara - solo mostrar si no estamos validando rack */}
      {!esperandoValidacionRack && (
        <CamaraEscaneo
          onBarCodeScanned={handleBarCodeScanned}
          scanning={scanning}
          scanned={scanned}
          onStartScanning={() => {
            setScanning(true);
            setScanned(false);
          }}
          onCancelScanning={() => {
            setScanning(false);
            setScanned(false);
          }}
          loading={updating}
        />
      )}

      {updating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="large" color="#023E8A" />
          <Text style={styles.updatingText}>Moviendo a rack...</Text>
        </View>
      )}

      <CustomAlert
        visible={alertVisible}
        title={alertProps.title}
        message={alertProps.message}
        buttons={alertProps.buttons}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  productInfo: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    elevation: 2,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 4,
  },
  productCode: {
    fontSize: 14,
    color: "#718096",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A5568",
    marginBottom: 4,
  },
  cajaInfo: {
    fontSize: 13,
    color: "#2D3748",
    marginBottom: 2,
  },
  rackInfo: {
    fontSize: 13,
    color: "#023E8A",
    fontWeight: "600",
    marginBottom: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },
  instruction: {
    fontSize: 14,
    color: "#4A5568",
    fontStyle: "italic",
    fontWeight: "500",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#023E8A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  updatingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  updatingText: {
    marginTop: 16,
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
});

export default SubirSueltoTemplate;
