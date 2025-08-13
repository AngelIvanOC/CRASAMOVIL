import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { useCameraPermissions } from "expo-camera";
import { useProductos } from "../../hooks/useProductos";
import { useRacks } from "../../hooks/useRacks";
import CamaraEscaneo from "../organismos/CamaraEscaneo";
import CustomAlert from "../atomos/Alertas/CustomAlert";
import ProductoEscaneadoForm from "../organismos/ProductoEscaneadoForm";
import ValidacionRackQR from "../organismos/ValidacionRackQR";

const EscanearEntradaTemplate = ({ navigation, onEntradaComplete, marca }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [productoEncontrado, setProductoEncontrado] = useState(null);
  const [cantidadManual, setCantidadManual] = useState("");
  const [fechaCaducidadManual, setFechaCaducidadManual] = useState("");
  const [resetQRScanner, setResetQRScanner] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const { obtenerRacksDisponiblesPorMarca } = useRacks();
  const [rackSugerido, setRackSugerido] = useState(null);
  const [racksDisponibles, setRacksDisponibles] = useState([]);
  const [esperandoValidacionRack, setEsperandoValidacionRack] = useState(false);
  const [datosParaConfirmar, setDatosParaConfirmar] = useState(null);

  const [esperandoSeleccionUbicacion, setEsperandoSeleccionUbicacion] =
    useState(false);
  const [productoTemporal, setProductoTemporal] = useState(null);

  const [alertProps, setAlertProps] = useState({
    title: "",
    message: "",
    buttons: [],
  });
  const {
    productos,
    fetchProductos,
    procesarEntradaCompleta,
    verificarCodigoBarrasUnico,
    agregarPendiente,
  } = useProductos(marca?.id);
  const alreadyHandledRef = useRef(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
    if (marca?.id) {
      fetchProductos(marca.id);
    }
  }, [permission, marca?.id]);

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

  const extractProductInfo = (barcode) => {
    const cleanBarcode = barcode.trim();
    console.log("Código de barras completo:", cleanBarcode);

    if (cleanBarcode.length < 12) {
      console.log("Código de barras muy corto:", cleanBarcode.length);
      return { productCode: cleanBarcode, cantidad: 0 };
    }

    if (cleanBarcode.length < 16) {
      const ultimos4 = cleanBarcode.slice(-4);
      console.log("Últimos 4 dígitos:", ultimos4);

      const codigoProducto = ultimos4.slice(0, 3);
      console.log("Código de producto (3 antepenúltimos):", codigoProducto);

      return { productCode: codigoProducto, cantidad: 0 };
    }

    try {
      const productCodeWithZeros = cleanBarcode.substring(0, 7);
      console.log("Código con ceros:", productCodeWithZeros);

      const productCode = productCodeWithZeros.replace(/^0+/, "") || "0";
      console.log("Código sin ceros:", productCode);

      const cantidadString = cleanBarcode.substring(7, 12);
      console.log("Cantidad string:", cantidadString);

      const cantidad = parseInt(cantidadString.replace(/^0+/, "") || "0");
      console.log("Cantidad final:", cantidad);

      return {
        productCode: productCode,
        cantidad: cantidad > 0 ? cantidad : 0,
      };
    } catch (error) {
      console.error("Error extrayendo información del código:", error);
      return { productCode: cleanBarcode, cantidad: 0 };
    }
  };

  const findProductByCode = (productCode) => {
    console.log("Buscando producto con código:", productCode);
    console.log("Marca actual:", marca?.nombre);
    console.log(
      "Productos disponibles:",
      productos.map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre }))
    );

    const producto = productos.find(
      (p) => String(p.codigo).trim() === String(productCode).trim()
    );

    if (producto) {
      console.log("Producto encontrado:", {
        id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        marca: producto.marcas?.nombre,
      });
    } else {
      console.log("Producto no encontrado para la marca:", marca?.nombre);
    }
    return producto;
  };

  const handleBarCodeScanned = async ({ data, productoManual }) => {
    if (productoManual) {
      const racks = await obtenerRacksDisponiblesPorMarca(
        marca.id,
        marca.nombre
      );
      setRacksDisponibles(racks);
      setRackSugerido(racks.length > 0 ? racks[0] : null);

      setProductoEncontrado({
        id: null,
        codigo: "",
        nombre: "",
        cantidad: 0,
        marca_id: marca.id,
        cantidadEscaneada: productoManual.cantidad || 1,
        codigoBarras: productoManual.codigoBarras || "",
        fechaCaducidad: productoManual.fechaCaducidad,
        datosOCR: productoManual,
        esEntradaManual: true,
      });

      setCantidadManual(productoManual.cantidad?.toString() || "1");
      return;
    }

    console.log("=== CÓDIGO ESCANEADO ===");
    console.log("Datos recibidos:", data);
    console.log("Longitud:", data.length);
    console.log("Tipo:", typeof data);

    if (!data || data.length < 8) {
      console.log("Código ignorado por longitud muy corta:", data);
      return;
    }

    if (data.length < 13) {
      console.log("Código ignorado por longitud:", data);
      return;
    }

    if (alreadyHandledRef.current || scanned || updating) {
      console.log("Escaneo ignorado - ya procesando");
      return;
    }

    console.log("Procesando código escaneado:", data);

    alreadyHandledRef.current = true;
    setScanned(true);
    setScanning(false);

    try {
      const { productCode, cantidad } = extractProductInfo(data);
      console.log("Código extraído:", productCode, "Cantidad:", cantidad);

      const producto = findProductByCode(productCode);

      if (producto) {
        console.log("Verificando código de barras único...");
        const esUnico = await verificarCodigoBarrasUnico(data);

        if (!esUnico) {
          showAlert({
            title: "Código ya registrado",
            message: "Este código de barras ya fue escaneado anteriormente",
          });
          return;
        }

        console.log(
          "Producto encontrado y código único - mostrando información"
        );

        const racks = await obtenerRacksDisponiblesPorMarca(
          producto.marca_id,
          marca.nombre
        );
        setRacksDisponibles(racks);

        if (racks.length > 0) {
          setRackSugerido(racks[0]);
        } else {
          console.warn("No hay racks disponibles para esta marca");
          setRackSugerido(null);
        }

        setProductoEncontrado({
          ...producto,
          cantidadEscaneada: cantidad,
          codigoBarras: data,
        });

        setCantidadManual(cantidad.toString());
      } else {
        console.log("Producto no encontrado");
        showAlert({
          title: "Producto No Encontrado",
          message: `No se encontró un producto con el código: ${productCode}`,
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
                  codigoproducto: productCode,
                  marca,
                });
              },
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error procesando código escaneado:", error);
      showAlert({
        title: "Error",
        message: "Hubo un error al procesar el código escaneado",
      });
    }
  };

  const handleConfirmEntrada = async (datosCompletos, cantidadFinal) => {
    try {
      setUpdating(true);

      const ubicacion =
        datosCompletos.tipoUbicacion === "suelto"
          ? "SUELTO"
          : datosCompletos.tipoUbicacion === "piso"
            ? "PISO"
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
    if (datosParaConfirmar?.datosCompletos?.tipoUbicacion === "suelto") {
      if (codigoQREscaneado.toUpperCase() === "SUELTO") {
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

    if (datosParaConfirmar?.datosCompletos?.tipoUbicacion === "piso") {
      if (codigoQREscaneado.toUpperCase() === "PISO") {
        showAlert({
          title: "¡Validación Exitosa!",
          message: `¿Confirmas la entrada de ${datosParaConfirmar.cantidadFinal} unidades del producto "${datosParaConfirmar.datosCompletos.nombre}" en PISO?`,
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
          title: "Código Incorrecto",
          message: `Para productos en PISO debes escanear el código QR que dice "PISO". Código escaneado: ${codigoQREscaneado}`,
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
      setEsperandoValidacionRack(false);
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

  const procesarEntrada = async (datosCompletos, cantidad) => {
    try {
      setUpdating(true);

      console.log("Iniciando procesamiento de entrada:", {
        productoId: productoEncontrado.id,
        cantidad: cantidad,
        codigoBarras: productoEncontrado.codigoBarras,
        tipoUbicacion: datosCompletos.tipoUbicacion,
      });

      const rackIdFinal =
        datosCompletos.tipoUbicacion === "rack"
          ? rackSugerido?.id || null
          : null;

      const resultado = await procesarEntradaCompleta(
        datosCompletos.id,
        cantidad,
        datosCompletos.codigoBarras,
        rackIdFinal,
        datosCompletos.fechaCaducidad || null,
        datosCompletos.tipoUbicacion
      );

      console.log("Entrada procesada exitosamente:", resultado);

      if (!resultado || resultado.cantidadAnterior === undefined) {
        console.warn("Resultado incompleto, pero continuando...");
      }

      const cantidadAnterior =
        resultado?.cantidadAnterior ?? datosCompletos.cantidad;
      const cantidadNueva =
        resultado?.cantidadNueva ?? datosCompletos.cantidad + cantidad;

      showAlert({
        title: "¡Entrada Registrada!",
        message: `Se han agregado ${cantidad} unidades del producto "${datosCompletos.nombre}"\n\nCantidad anterior: ${cantidadAnterior}\nCantidad nueva: ${cantidadNueva}\n\nCódigo de barras: ${datosCompletos.codigoBarras}`,
        buttons: [
          {
            text: "Continuar",
            onPress: () => {
              setAlertVisible(false);
              setProductoEncontrado(null);
              setScanned(false);
              setScanning(false);
              setCantidadManual("");
              setRackSugerido(null);
              setRacksDisponibles([]);
              alreadyHandledRef.current = false;
              fetchProductos(marca.id);
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
      showAlert({
        title: "Error",
        message: `No se pudo procesar la entrada. Por favor, intenta nuevamente.\n\nDetalles del error: ${
          error?.message || "Error desconocido"
        }`,
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

  const handleCancelProducto = () => {
    setProductoEncontrado(null);
    setScanned(false);
    setScanning(false);
    setCantidadManual("");
    setRackSugerido(null);
    setRacksDisponibles([]);
    alreadyHandledRef.current = false;
  };

  const handleStartScanning = () => {
    setScanning(true);
    setScanned(false);
    setProductoEncontrado(null);
    alreadyHandledRef.current = false;
  };

  const handleCancelScanning = () => {
    setScanning(false);
    setScanned(false);
    setProductoEncontrado(null);
    alreadyHandledRef.current = false;
    setAlertVisible(false);
    navigation.goBack();
  };

  const handleRescan = () => {
    setScanned(false);
    setScanning(true);
    setProductoEncontrado(null);
    alreadyHandledRef.current = false;
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

      {!productoEncontrado && (
        <CamaraEscaneo
          onBarCodeScanned={handleBarCodeScanned}
          scanning={scanning}
          scanned={scanned}
          onStartScanning={handleStartScanning}
          onCancelScanning={handleCancelScanning}
          loading={updating}
          onProductoDetectado={(productoManual) =>
            handleBarCodeScanned({ data: null, productoManual })
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  productInfoContainer: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#023E8A",
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  productCode: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  productStock: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  barcodeInfo: {
    fontSize: 12,
    color: "#888",
    marginBottom: 12,
    fontFamily: "monospace",
  },
  cantidadContainer: {
    marginTop: 12,
  },
  cantidadLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  cantidadInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
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
  confirmButton: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelProductButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelProductButtonText: {
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

export default EscanearEntradaTemplate;
