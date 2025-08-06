// EscanearCostenaTemplate.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useCameraPermissions } from "expo-camera";
import { useProductos } from "../../hooks/useProductos";
import { useRacks } from "../../hooks/useRacks";
import CamaraCostena from "../organismos/CamaraCostena";
import CustomAlert from "../atomos/Alertas/CustomAlert";
import ProductoEscaneadoForm from "../organismos/ProductoEscaneadoForm";
import ValidacionRackQR from "../organismos/ValidacionRackQR";

const EscanearCostenaTemplate = ({ navigation, onEntradaComplete, marca }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [updating, setUpdating] = useState(false);
  const [productoEncontrado, setProductoEncontrado] = useState(null);
  const [cantidadManual, setCantidadManual] = useState("1");
  const [racksDisponibles, setRacksDisponibles] = useState([]);
  const [rackSugerido, setRackSugerido] = useState(null);
  const [esperandoValidacionRack, setEsperandoValidacionRack] = useState(false);
  const [datosParaConfirmar, setDatosParaConfirmar] = useState(null);
  const [resetQRScanner, setResetQRScanner] = useState(false);

  const { obtenerRacksDisponiblesPorMarca } = useRacks();
  const {
    productos,
    fetchProductos,
    procesarEntradaCompleta,
    verificarCodigoBarrasUnico,
    agregarPendiente,
  } = useProductos(marca?.id);
  const [alertVisible, setAlertVisible] = useState(false);

  const [alertProps, setAlertProps] = useState({
    title: "",
    message: "",
    buttons: [],
  });

  const alreadyHandledRef = useRef(false);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (marca?.id) {
        fetchProductos(marca.id);
      }
    });

    return unsubscribe;
  }, [navigation, marca?.id]);

  const showAlert = ({ title, message, buttons = [] }) => {
    setAlertProps({ title, message, buttons });
    setAlertVisible(true);

    // Si no tiene botones, cerrar automáticamente después de 4 segundos
    if (buttons.length === 0) {
      setTimeout(() => {
        setAlertVisible(false);
        resetScannerState();
      }, 4000);
    }
  };

  const resetScannerState = () => {
    setScanned(false);
    setScanning(false);
    alreadyHandledRef.current = false;
  };

  const handleProductoDetectado = async (productoData) => {
    if (!productoData.codigo) {
      const racks = await obtenerRacksDisponiblesPorMarca(marca.id);
      setRacksDisponibles(racks);
      setRackSugerido(racks.length > 0 ? racks[0] : null);

      setProductoEncontrado({
        id: null,
        codigo: "",
        nombre: "",
        cantidad: 0,
        marca_id: marca.id,
        cantidadEscaneada: productoData.cantidad || 1,
        codigoBarras: productoData.codigoBarras || "",
        fechaCaducidad: productoData.fechaCaducidad,
        datosOCR: productoData,
        esEntradaManual: true,
      });

      setCantidadManual(productoData.cantidad?.toString() || "1");
      return;
    }

    try {
      const producto = productos.find(
        (p) => String(p.codigo).trim() === String(productoData.codigo).trim()
      );

      if (!producto) {
        showAlert({
          title: "Producto No Encontrado",
          message: `No se encontró un producto con el código: ${productoData.codigo}`,
          buttons: [
            {
              text: "Cancelar",
              onPress: () => setAlertVisible(false),
              style: "cancel",
            },
            {
              text: "Agregar Producto",
              onPress: () => {
                setAlertVisible(false);
                navigation.navigate("AgregarProducto", {
                  codigoproducto: productoData.codigo,
                  nombre: productoData.descripcion,
                  marca,
                });
              },
            },
          ],
        });
        return;
      }

      if (productoData.codigoBarras) {
        const esUnico = await verificarCodigoBarrasUnico(
          productoData.codigoBarras
        );
        if (!esUnico) {
          showAlert({
            title: "Código ya registrado",
            message: "Este código de barras ya fue escaneado anteriormente",
            buttons: [
              {
                text: "Entendido",
                onPress: () => {
                  setAlertVisible(false);
                  setProductoEncontrado(null);
                },
              },
            ],
          });
          return;
        }
      }

      const racks = await obtenerRacksDisponiblesPorMarca(producto.marca_id);
      setRacksDisponibles(racks);
      setRackSugerido(racks.length > 0 ? racks[0] : null);

      setProductoEncontrado({
        ...producto,
        cantidadEscaneada: productoData.cantidad || 1,
        codigoBarras: productoData.codigoBarras || "",
        fechaCaducidad: productoData.fechaCaducidad,
        datosOCR: productoData,
      });

      console.log("Código:", productoData.codigo);
      console.log("Descripción:", productoData.descripcion);
      console.log("Cantidad:", productoData.cantidad);
      console.log("Fecha caducidad:", productoData.fechaCaducidad);
      console.log("Código de barras:", productoData.codigoBarras);

      setCantidadManual(productoData.cantidad?.toString() || "1");
    } catch (error) {
      console.error("Error al procesar producto detectado:", error);
      showAlert({
        title: "Error",
        message: "No se pudo procesar el producto detectado",
        buttons: [
          {
            text: "OK",
            onPress: () => setAlertVisible(false),
          },
        ],
      });
    }
  };

  // En EscanearCostenaTemplate.js
  const handleConfirmEntrada = async (datosCompletos, cantidadFinal) => {
    try {
      setUpdating(true);

      const ubicacion =
        datosCompletos.tipoUbicacion === "suelto"
          ? "SUELTO"
          : rackSugerido?.codigo_rack;

      await agregarPendiente(
        datosCompletos.id,
        cantidadFinal,
        datosCompletos.codigoBarras,
        ubicacion,
        datosCompletos.fechaCaducidad
      );

      showAlert({
        title: "¡Pendiente creado!",
        message: `Se ha creado un pendiente para ${cantidadFinal} unidades de "${datosCompletos.nombre}"`,
        buttons: [
          {
            text: "Salir",
            onPress: () => {
              setAlertVisible(false);
              navigation.goBack();
              setProductoEncontrado(null);
            },
          },
          {
            text: "Continuar",
            onPress: () => {
              setAlertVisible(false);
              setProductoEncontrado(null);
            },
          },
        ],
      });
    } catch (error) {
      showAlert({
        title: "Error",
        message: `No se pudo crear el pendiente: ${error.message}`,
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

  const handleQRRackEscaneado = (codigoQREscaneado) => {
    // ✅ CASO 1: Si es tipo "suelto", validar que el QR sea "SUELTO"
    if (datosParaConfirmar?.datosCompletos?.tipoUbicacion === "suelto") {
      if (codigoQREscaneado.toUpperCase() === "SUELTO") {
        // Código correcto para suelto
        showAlert({
          title: "¡Validación Exitosa!",
          message: `¿Confirmas la entrada de ${datosParaConfirmar.cantidadFinal} unidades del producto "${datosParaConfirmar.datosCompletos.nombre}" como producto SUELTO?`,
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
                // ✅ Procesar entrada sin rack (null)
                await procesarEntrada(
                  datosParaConfirmar.datosCompletos,
                  datosParaConfirmar.cantidadFinal
                );
              },
            },
          ],
        });
      } else {
        // Código incorrecto para suelto
        showAlert({
          title: "Código Incorrecto",
          message: `Para productos SUELTOS debes escanear el código QR que dice "SUELTO". Código escaneado: ${codigoQREscaneado}`,
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
      return;
    }

    // ✅ CASO 2: Si es tipo "rack", validar con el rack asignado
    if (!rackSugerido) {
      showAlert({
        title: "Error",
        message: "No hay rack seleccionado",
        buttons: [
          {
            text: "OK",
            onPress: () => {
              setAlertVisible(false);
              setEsperandoValidacionRack(false);
            },
          },
        ],
      });
      return;
    }

    if (codigoQREscaneado === rackSugerido.codigo_rack) {
      showAlert({
        title: "¡Rack Validado!",
        message: `¿Confirmas la entrada de ${datosParaConfirmar.cantidadFinal} unidades del producto "${datosParaConfirmar.datosCompletos.nombre}" en el rack ${rackSugerido.codigo_rack}?`,
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
              await procesarEntrada(
                datosParaConfirmar.datosCompletos,
                datosParaConfirmar.cantidadFinal
              );
            },
          },
        ],
      });
    } else {
      showAlert({
        title: "Rack Incorrecto",
        message: `El código escaneado (${codigoQREscaneado}) no coincide con el rack asignado (${rackSugerido.codigo_rack}). Por favor, escanea el código QR del rack correcto.`,
        buttons: [
          {
            text: "Reintentar",
            onPress: () => {
              setAlertVisible(false);
              // AQUÍ ESTÁ EL CAMBIO CLAVE: Resetear el scanner QR
              setResetQRScanner(true);
              // Resetear el flag después de un breve delay
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

  const procesarEntrada = async (datosCompletos, cantidad) => {
    try {
      setUpdating(true);

      const rackIdFinal =
        datosCompletos.tipoUbicacion === "suelto"
          ? null
          : rackSugerido?.id || null;

      await procesarEntradaCompleta(
        datosCompletos.id,
        cantidad,
        datosCompletos.codigoBarras,
        rackIdFinal,
        datosCompletos.fechaCaducidad,
        datosCompletos.tipoUbicacion
      );

      showAlert({
        title: "¡Entrada Registrada!",
        message: `Se han agregado ${cantidad} unidades del producto "${datosCompletos.nombre}"`,
        buttons: [
          {
            text: "Continuar",
            onPress: () => {
              setAlertVisible(false);
              setProductoEncontrado(null);
              setCantidadManual("1");
            },
          },
          {
            text: "Finalizar",
            onPress: () => {
              setAlertVisible(false);
              if (onEntradaComplete) {
                onEntradaComplete();
              }
            },
          },
        ],
      });
    } catch (error) {
      console.error("Error procesando entrada:", error);

      if (error.message.includes("ya fue registrado")) {
        showAlert({
          title: "Código duplicado",
          message:
            "La etiqueta escaneada ya fue registrada. Por favor verifica:",
          buttons: [
            {
              text: "Ver detalles",
              onPress: () => {
                setAlertVisible(false);
                navigation.navigate("HistorialEntradas", {
                  producto: productoEncontrado,
                });
              },
            },
            {
              text: "Continuar",
              style: "cancel",
              onPress: () => {
                setAlertVisible(false);
                setProductoEncontrado(null);
              },
            },
          ],
        });
      } else {
        showAlert({
          title: "Error",
          message: `No se pudo procesar la entrada: ${error.message}`,
          buttons: [
            {
              text: "OK",
              onPress: () => setAlertVisible(false),
            },
          ],
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelProducto = () => {
    setProductoEncontrado(null);
    setCantidadManual("1");
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
          onPress={requestPermission}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!productoEncontrado && (
        <CamaraCostena onProductoDetectado={handleProductoDetectado} />
      )}

      {productoEncontrado && (
        <ProductoEscaneadoForm
          productoEncontrado={productoEncontrado}
          onConfirmEntrada={handleConfirmEntrada}
          onCancel={handleCancelProducto}
          rackSugerido={rackSugerido}
          racksDisponibles={racksDisponibles}
          onRackChange={setRackSugerido}
          updating={updating}
          setUpdating={setUpdating}
        />
      )}

      {esperandoValidacionRack && (
        <ValidacionRackQR
          onQRRackEscaneado={handleQRRackEscaneado}
          rackEsperado={rackSugerido}
          onCancel={() => setEsperandoValidacionRack(false)}
          resetScan={resetQRScanner}
          tipoUbicacion={
            datosParaConfirmar?.datosCompletos?.tipoUbicacion || "rack"
          }
        />
      )}

      {updating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="large" color="#023E8A" />
          <Text style={styles.updatingText}>Procesando entrada...</Text>
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

export default EscanearCostenaTemplate;
