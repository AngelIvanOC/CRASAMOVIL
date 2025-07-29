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

const BajarPisoTemplate = ({ producto, navigation, onScanComplete }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [updating, setUpdating] = useState(false);
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

    // Si no tiene botones, cerrar automáticamente después de 4 segundos
    if (buttons.length === 0) {
      setTimeout(() => {
        setAlertVisible(false);
      }, 4000);
    }
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
    console.log("[DEBUG] Producto:", producto.nombre);

    try {
      // Buscar primero en cajas
      const { data: cajaData, error: cajaError } = await supabase
        .from("cajas")
        .select(
          `
          id,
          producto_id,
          cantidad,
          codigo_barras,
          productos (
            id,
            codigo,
            nombre
          ),
          racks (
            codigo_rack
          )
        `
        )
        .eq("codigo_barras", scannedCode)
        .single();

      // Si no se encuentra en cajas, buscar en suelto
      if (cajaError && cajaError.code === "PGRST116") {
        const { data: sueltoData, error: sueltoError } = await supabase
          .from("suelto")
          .select(
            `
            id,
            producto_id,
            cantidad,
            codigo_barras,
            productos (
              id,
              codigo,
              nombre
            )
          `
          )
          .eq("codigo_barras", scannedCode)
          .single();

        if (sueltoError) {
          console.error(
            "[ERROR] No encontrado en cajas ni suelto:",
            sueltoError
          );
          showAlert({
            title: "Código no encontrado",
            message:
              "Este código de barras no está registrado en racks ni suelto.",
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

        // Verificar que pertenece al producto correcto (suelto)
        if (sueltoData.producto_id !== producto.id) {
          showAlert({
            title: "Producto incorrecto",
            message: `Este código pertenece a: ${sueltoData.productos.nombre}`,
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

        // Confirmar antes de mover (desde suelto)
        showAlert({
          title: "Confirmar movimiento",
          message: `¿Mover ${sueltoData.cantidad} unidades de ${sueltoData.productos.nombre} de suelto al piso?`,
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
              text: "Confirmar",
              onPress: () => {
                setAlertVisible(false);
                handleMoverAPisoSuelto(sueltoData.id, sueltoData.cantidad);
              },
            },
          ],
        });
        return;
      }

      if (cajaError) {
        console.error("[ERROR] Error en consulta:", cajaError);
        showAlert({
          title: "Error",
          message: "Ocurrió un error al verificar el código de barras.",
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

      // Verificar que pertenece al producto correcto (cajas)
      if (cajaData.producto_id !== producto.id) {
        showAlert({
          title: "Producto incorrecto",
          message: `Este código pertenece a: ${cajaData.productos.nombre}`,
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

      // Confirmar antes de mover (desde rack)
      showAlert({
        title: "Confirmar movimiento",
        message: `¿Mover ${cajaData.cantidad} unidades de ${
          cajaData.productos.nombre
        } del rack ${cajaData.racks?.codigo_rack || "N/A"} al piso?`,
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
            text: "Confirmar",
            onPress: () => {
              setAlertVisible(false);
              handleMoverAPiso(cajaData.id, cajaData.cantidad);
            },
          },
        ],
      });
    } catch (error) {
      console.error("[ERROR] Error en proceso de verificación:", error);
      showAlert({
        title: "Error",
        message: "Ocurrió un error al verificar el código de barras.",
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
    }
  };

  const handleMoverAPisoSuelto = async (sueltoId, cantidad) => {
    try {
      setUpdating(true);

      // Usar la función SQL para mover de suelto a piso
      const { data, error } = await supabase.rpc("mover_suelto_a_piso", {
        suelto_id: sueltoId,
      });

      if (error) {
        console.error("Error al mover suelto a piso:", error);
        showAlert({
          title: "Error",
          message: "No se pudo mover el producto de suelto al piso",
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
        title: "Éxito",
        message: `Se movieron ${cantidad} unidades de suelto al piso correctamente.`,
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
      console.error("Error moviendo suelto a piso:", error);
      showAlert({
        title: "Error",
        message: error.message || "Error desconocido al mover desde suelto.",
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

  const handleMoverAPiso = async (cajaId, cantidad) => {
    try {
      setUpdating(true);

      // Usar la función SQL para mover la caja
      const { data, error } = await supabase.rpc("mover_caja_a_piso", {
        caja_id: cajaId,
      });

      if (error) {
        console.error("Error al mover a piso:", error);
        showAlert({
          title: "Error",
          message: "No se pudo mover el producto al piso",
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
        title: "Éxito",
        message: `Se movieron ${cantidad} unidades al piso correctamente.`,
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
      console.error("Error moviendo a piso:", error);
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
      {/* Info del producto */}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{producto.nombre}</Text>
        <Text style={styles.productCode}>Código: {producto.codigo}</Text>
        <Text style={styles.instruction}>
          Escanea el código de barras de la caja que quieres bajar al piso
        </Text>
      </View>

      {/* Cámara */}
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

      {updating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="large" color="#023E8A" />
          <Text style={styles.updatingText}>Moviendo a piso...</Text>
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
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: "#4A5568",
    fontStyle: "italic",
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

export default BajarPisoTemplate;
