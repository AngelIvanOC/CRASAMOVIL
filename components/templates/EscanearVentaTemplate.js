import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useDetalleVentas } from "../../hooks/useDetalleVentas";
import { useProductos } from "../../hooks/useProductos";
import CardProductoEscaneo from "../moleculas/CardProductoEscaneo";
import CamaraEscaneo from "../organismos/CamaraEscaneo";
import { supabase } from "../../supabase/supabase";
import CustomAlert from "../atomos/Alertas/CustomAlert";

const EscanearVentaTemplate = ({
  detalle,
  ventaId,
  navigation,
  onScanComplete,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { updateEstadoDetalle } = useDetalleVentas(ventaId);
  const { procesarSalidaCompleta } = useProductos();
  const [cantidadRestante, setCantidadRestante] = useState(detalle.cantidad);
  const escaneadoInicial = detalle.escaneado || 0;
  const [cantidadAcumulada, setCantidadAcumulada] = useState(escaneadoInicial);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertProps, setAlertProps] = useState({
    title: "",
    message: "",
    buttons: [],
  });

  const alreadyHandledRef = useRef(false);

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

  const extractProductCode = (barcode) => {
    // Función para extraer el código del producto desde el código de barras
    const cleanBarcode = barcode.trim();

    // Si el código de barras tiene al menos 7 dígitos
    if (cleanBarcode.length >= 7) {
      // Tomar los primeros 7 dígitos (incluyendo los 0s del inicio)
      const first7Digits = cleanBarcode.substring(0, 7);

      // Después remover los 0s del inicio
      const withoutLeadingZeros = first7Digits.replace(/^0+/, "");

      // Si después de quitar los 0s queda algo, devolverlo
      if (withoutLeadingZeros.length > 0) {
        return withoutLeadingZeros;
      }
    }

    // Si no cumple con el formato esperado, devolver el código original
    return cleanBarcode;
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

    // 1. Obtener información del producto
    const productCode = detalle.productos?.codigo;
    const scannedCode = data.trim();

    console.log("[DEBUG] Producto esperado:", {
      codigo: productCode,
      nombre: detalle.productos?.nombre,
    });
    console.log("[DEBUG] Código escaneado:", scannedCode);

    try {
      console.log("[DEBUG] Buscando código de barras en cajas...");

      const { data: pisoData, error } = await supabase
        .from("piso") // ✅ Cambiar de "cajas" a "piso"
        .select(
          `
    producto_id,
    productos (
      id,
      codigo
    )
  `
        )
        .eq("codigo_barras", scannedCode)
        .single();

      console.log("[DEBUG] Resultado consulta cajas:", { pisoData, error });

      if (error) {
        console.error("[ERROR] Supabase query error:", error);
        throw error;
      }

      if (!pisoData || !pisoData.productos) {
        console.log("[DEBUG] No se encontró el código de barras en piso");
        showAlert({
          title: "Código no registrado",
          message: "Este código de barras no está registrado en el sistema.",
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

      const scannedProductCode = String(pisoData.productos.codigo).trim();
      const expectedProductCode = String(productCode || "").trim();

      console.log("[DEBUG] Comparando códigos:", {
        escaneado: scannedProductCode,
        esperado: expectedProductCode,
        coinciden: scannedProductCode === expectedProductCode,
      });

      if (scannedProductCode === expectedProductCode) {
        console.log("[DEBUG] Códigos coinciden - procesando...");
        await handleUpdateStatus(scannedCode);
        return;
      } else {
        console.log("[DEBUG] Códigos NO coinciden");
        showAlert({
          title: "Producto incorrecto",
          message: `El código escaneado pertenece a otro producto (${scannedProductCode})`,
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
    } catch (error) {
      console.error("[ERROR] Error en proceso de verificación:", error);
      showAlert({
        title: "Error",
        message:
          "Ocurrió un error al verificar el código de barras. Por favor intenta nuevamente.",
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
  };

  const handleUpdateStatus = async (scannedCode) => {
    try {
      setUpdating(true);

      const cantidadPendiente = detalle.cantidad - (detalle.escaneado || 0);

      // Procesar salida solo por la cantidad pendiente
      const resultado = await procesarSalidaCompleta(
        detalle.productos.id,
        cantidadPendiente,
        scannedCode,
        detalle.id
      );

      const cantidadRestada = resultado?.cantidadRestada || 0;
      setCantidadAcumulada((prev) => prev + cantidadRestada);

      const { data: detalleActualizado, error: detalleError } = await supabase
        .from("detalle_ventas")
        .select("id, cantidad, escaneado")
        .eq("id", detalle.id)
        .single();

      if (detalleError) throw detalleError;

      const escaneadoFinal = detalleActualizado.escaneado || 0;
      const cantidadTotal = detalleActualizado.cantidad || 0;
      const restante = cantidadTotal - escaneadoFinal;

      setCantidadRestante(restante);

      // 2. REEMPLAZAR el bloque de alerts:
      if (restante <= 0) {
        await updateEstadoDetalle(detalle.id, "completado");
        showAlert({
          title: "Venta Completada",
          message: `Se escanearon todas las unidades requeridas (${cantidadTotal}).`,
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
      } else {
        // ✅ ACTUALIZAR estado a "pendiente" si hay progreso parcial
        if (escaneadoFinal > 0) {
          await updateEstadoDetalle(detalle.id, "pendiente");
        }

        showAlert({
          title: "Producto Escaneado",
          message: `Se escanearon ${cantidadRestada} unidades de este código. Progreso: ${escaneadoFinal} de ${cantidadTotal} unidades.`,
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
      }
    } catch (error) {
      console.error("Error actualizando estado:", error);
      showAlert({
        title: "Error",
        message: error.message || "Error desconocido al procesar la salida.",
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

  const handleManualComplete = () => {
    Alert.alert(
      "Completar Manualmente",
      `¿Estás seguro de que quieres marcar este producto como completado sin escanear?\n\nEsto restará ${detalle.cantidad} unidades del stock.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            await handleUpdateStatus("MANUAL");
          },
        },
      ]
    );
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
          No se tiene acceso a la cámara. Por favor, habilita los permisos de
          cámara en la configuración de la aplicación.
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
      {/* Información del producto 
      <CardProductoEscaneo detalle={detalle} />*/}

      {/* Cámara de escaneo */}
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

      <CustomAlert
        visible={alertVisible}
        title={alertProps.title}
        message={alertProps.message}
        buttons={alertProps.buttons}
        onClose={() => setAlertVisible(false)}
      />

      {/* Controles 
      <View style={styles.controlsContainer}>
        {!scanning && !scanned && (
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => {
              setScanning(true);
              setScanned(false);
            }}
            disabled={updating}
          >
            <Text style={styles.scanButtonText}>
              {updating ? "Procesando..." : "Iniciar Escaneo"}
            </Text>
          </TouchableOpacity>
        )}

        {scanning && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setScanning(false);
              setScanned(false);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancelar Escaneo</Text>
          </TouchableOpacity>
        )}

        {scanned && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => {
              setScanned(false);
              setScanning(true);
            }}
            disabled={updating}
          >
            <Text style={styles.rescanButtonText}>Escanear Nuevamente</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.manualButton}
          onPress={handleManualComplete}
          disabled={updating || scanning}
        >
          <Text style={styles.manualButtonText}>Completar Manualmente</Text>
        </TouchableOpacity>
      </View>
*/}
      {updating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="large" color="#023E8A" />
          <Text style={styles.updatingText}>Actualizando estado...</Text>
        </View>
      )}
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
  controlsContainer: {
    padding: 20,
    gap: 12,
  },
  scanButton: {
    backgroundColor: "#28a745",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  scanButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  rescanButton: {
    backgroundColor: "#ffc107",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  rescanButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  manualButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  manualButtonText: {
    color: "white",
    fontSize: 16,
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

export default EscanearVentaTemplate;
