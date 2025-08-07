// SubirSueltoTemplate.js
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
import { useProductos } from "../../hooks/useProductos";

const SubirSueltoTemplate = ({
  producto,
  sueltoItem,
  rackSugerido,
  navigation,
  onScanComplete,
}) => {
  const { agregarPendiente } = useProductos();
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

    // Código correcto, mostrar confirmación para crear pendiente
    showAlert({
      title: "¡Código Validado!",
      message: `¿Deseas crear un pendiente para mover esta caja al rack ${rackSugerido.codigo_rack}?`,
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
          text: "Crear Pendiente",
          onPress: async () => {
            setAlertVisible(false);
            await crearPendiente();
          },
        },
      ],
    });
  };

  const crearPendiente = async () => {
    try {
      setUpdating(true);

      // Primero, crear el pendiente
      await agregarPendiente(
        producto.id,
        sueltoItem.cantidad,
        sueltoItem.codigo_barras,
        rackSugerido.codigo_rack,
        sueltoItem.fecha_caducidad
      );

      // Luego, eliminar de la tabla suelto
      const { error: deleteError } = await supabase
        .from("suelto")
        .delete()
        .eq("id", sueltoItem.id);

      if (deleteError) {
        throw new Error(
          "No se pudo eliminar de suelto: " + deleteError.message
        );
      }

      showAlert({
        title: "¡Pendiente creado!",
        message: `Se ha creado un pendiente para mover ${sueltoItem.cantidad} unidades de ${producto.nombre} al rack ${rackSugerido.codigo_rack}.`,
        buttons: [
          {
            text: "OK",
            onPress: () => {
              onScanComplete?.();
            },
          },
        ],
      });
    } catch (error) {
      console.error("Error en el proceso:", error);
      showAlert({
        title: "Error",
        message: error.message || "No se pudo completar la operación",
        buttons: [
          {
            text: "OK",
            onPress: () => setAlertVisible(false),
          },
        ],
      });
    } finally {
      setUpdating(false);
    }
  };

  // Resto del código (render) permanece igual...
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
          Escanea el código de barras de la caja seleccionada para crear un
          pendiente
        </Text>
      </View>

      {/* Cámara */}
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
          <Text style={styles.updatingText}>Creando pendiente...</Text>
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

// Los estilos permanecen igual...
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
