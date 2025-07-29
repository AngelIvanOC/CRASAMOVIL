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
import ValidacionRackQR from "../organismos/ValidacionRackQR"; // Componente que crearemos después

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
  } = useProductos(marca?.id);
  const alreadyHandledRef = useRef(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
    // Cargar productos de la marca específica
    if (marca?.id) {
      fetchProductos(marca.id);
    }
  }, [permission, marca?.id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (marca?.id) {
        fetchProductos(marca.id); // recarga productos al volver
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
        // Resetear estados después de mostrar la alerta
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
    // Función para extraer código de producto y cantidad del código de barras formato Jumex
    const cleanBarcode = barcode.trim();
    console.log("Código de barras completo:", cleanBarcode);

    // Verificar que tenga al menos 12 dígitos (7 del código + 5 de cantidad)
    if (cleanBarcode.length < 12) {
      console.log("Código de barras muy corto:", cleanBarcode.length);
      return { productCode: cleanBarcode, cantidad: 0 };
    }

    if (cleanBarcode.length < 16) {
      // TOMAR LOS ÚLTIMOS 4 DÍGITOS
      const ultimos4 = cleanBarcode.slice(-4);
      console.log("Últimos 4 dígitos:", ultimos4);

      // QUITAR EL ÚLTIMO => quedan los 3 antepenúltimos
      const codigoProducto = ultimos4.slice(0, 3);
      console.log("Código de producto (3 antepenúltimos):", codigoProducto);

      return { productCode: codigoProducto, cantidad: 0 };
    }

    try {
      // Extraer los primeros 7 dígitos (código del producto)
      const productCodeWithZeros = cleanBarcode.substring(0, 7);
      console.log("Código con ceros:", productCodeWithZeros);

      // Remover ceros iniciales pero mantener al menos un dígito
      const productCode = productCodeWithZeros.replace(/^0+/, "") || "0";
      console.log("Código sin ceros:", productCode);

      // Extraer los siguientes 5 dígitos (cantidad)
      const cantidadString = cleanBarcode.substring(7, 12);
      console.log("Cantidad string:", cantidadString);

      // Convertir cantidad a número, removiendo ceros iniciales
      const cantidad = parseInt(cantidadString.replace(/^0+/, "") || "0");
      console.log("Cantidad final:", cantidad);

      return {
        productCode: productCode,
        cantidad: cantidad > 0 ? cantidad : 0, // Asegurar que la cantidad sea al menos 1
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

  const handleBarCodeScanned = async ({ data }) => {
    console.log("=== CÓDIGO ESCANEADO ===");
    console.log("Datos recibidos:", data);
    console.log("Longitud:", data.length);
    console.log("Tipo:", typeof data);

    // Cambiar el filtro - los códigos EAN-13 tienen exactamente 13 dígitos
    // pero también permitir otros formatos comunes
    if (!data || data.length < 8) {
      console.log("Código ignorado por longitud muy corta:", data);
      return;
    }

    if (data.length < 13) {
      console.log("Código ignorado por longitud:", data);
      return; // ignorar códigos que no sean de 12 dígitos
    }
    // Verificar si ya se está procesando un escaneo
    if (alreadyHandledRef.current || scanned || updating) {
      console.log("Escaneo ignorado - ya procesando");
      return;
    }

    console.log("Procesando código escaneado:", data);

    // Marcar como procesando
    alreadyHandledRef.current = true;
    setScanned(true);
    setScanning(false);

    try {
      const { productCode, cantidad } = extractProductInfo(data);
      console.log("Código extraído:", productCode, "Cantidad:", cantidad);

      const producto = findProductByCode(productCode);

      if (producto) {
        // Verificar si el código de barras ya existe
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

        // Obtener racks disponibles
        const racks = await obtenerRacksDisponiblesPorMarca(producto.marca_id);
        setRacksDisponibles(racks);

        if (racks.length > 0) {
          setRackSugerido(racks[0]);
        } else {
          console.warn("No hay racks disponibles para esta marca");
          setRackSugerido(null);
        }

        // Configurar el producto encontrado
        setProductoEncontrado({
          ...producto,
          cantidadEscaneada: cantidad,
          codigoBarras: data,
        });

        setCantidadManual(cantidad.toString());

        // NO resetear aquí - queremos mantener el estado para mostrar la información
        // alreadyHandledRef.current = false;
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

  const handleConfirmEntrada = (datosCompletos, cantidadFinal) => {
    /*if (!productoEncontrado) return;

    const cantidadFinal =
      parseInt(cantidadManual) || productoEncontrado.cantidadEscaneada;

    if (cantidadFinal <= 0) {
      Alert.alert("Error", "La cantidad debe ser mayor a 0");
      return;
    }*/

    setDatosParaConfirmar({ datosCompletos, cantidadFinal });
    setEsperandoValidacionRack(true);

    /*Alert.alert(
      "Confirmar Entrada",
      `¿Confirmas la entrada de ${cantidadFinal} unidades del producto "${
        datosCompletos.nombre
      }"?\n\nCantidad actual: ${
        datosCompletos.cantidad
      }\nCantidad después de la entrada: ${
        datosCompletos.cantidad + cantidadFinal
      }`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            await procesarEntrada(datosCompletos, cantidadFinal);
          },
        },
      ]
    );*/
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
      setEsperandoValidacionRack(false);
      return;
    }

    // Comparar el código escaneado con el rack sugerido
    if (codigoQREscaneado === rackSugerido.codigo_rack) {
      // Código correcto, proceder con la entrada
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
      // Código incorrecto
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

      console.log("Iniciando procesamiento de entrada:", {
        productoId: productoEncontrado.id,
        cantidad: cantidad,
        codigoBarras: productoEncontrado.codigoBarras,
        tipoUbicacion: datosCompletos.tipoUbicacion,
      });

      // ✅ Si es suelto, pasar null como rack_id
      const rackIdFinal =
        datosCompletos.tipoUbicacion === "suelto"
          ? null
          : rackSugerido?.id || null;

      // Usar la función completa que actualiza el producto y crea el historial
      const resultado = await procesarEntradaCompleta(
        datosCompletos.id,
        cantidad,
        datosCompletos.codigoBarras,
        rackIdFinal,
        datosCompletos.fechaCaducidad || null,
        datosCompletos.tipoUbicacion
      );

      console.log("Entrada procesada exitosamente:", resultado);

      // Verificar que el resultado tenga los datos esperados
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
              // Resetear completamente para permitir otro escaneo
              setProductoEncontrado(null);
              setScanned(false);
              setScanning(false);
              setCantidadManual("");
              setRackSugerido(null);
              setRacksDisponibles([]);
              alreadyHandledRef.current = false;
              // Recargar productos para obtener cantidades actualizadas
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
      {/* Información del producto encontrado */}

      {productoEncontrado && (
        <ProductoEscaneadoForm
          productoEncontrado={productoEncontrado}
          onConfirmEntrada={handleConfirmEntrada}
          onCancel={handleCancelProducto}
          rackSugerido={rackSugerido}
          racksDisponibles={racksDisponibles}
          onRackChange={setRackSugerido}
          updating={updating}
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
          } // ✅ Nuevo prop
        />
      )}

      {/* Cámara de escaneo con botón integrado */}
      {!productoEncontrado && (
        <CamaraEscaneo
          onBarCodeScanned={handleBarCodeScanned}
          scanning={scanning}
          scanned={scanned}
          onStartScanning={handleStartScanning}
          onCancelScanning={handleCancelScanning}
          loading={updating}
        />
      )}
      {/* Controles
        <View style={styles.controlsContainer}>
          {!productoEncontrado && !scanning && !scanned && (
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleStartScanning}
              disabled={updating}
            >
              <Text style={styles.scanButtonText}>
                {updating ? "Procesando..." : "Iniciar Escaneo"}
              </Text>
            </TouchableOpacity>
          )}

          {!productoEncontrado && scanning && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelScanning}
            >
              <Text style={styles.cancelButtonText}>Cancelar Escaneo</Text>
            </TouchableOpacity>
          )}

          {!productoEncontrado && scanned && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={handleRescan}
              disabled={updating}
            >
              <Text style={styles.rescanButtonText}>Escanear Nuevamente</Text>
            </TouchableOpacity>
          )}

          {productoEncontrado && (
            <>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmEntrada}
                disabled={updating}
              >
                <Text style={styles.confirmButtonText}>
                  {updating ? "Procesando..." : "Confirmar Entrada"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelProductButton}
                onPress={handleCancelProducto}
                disabled={updating}
              >
                <Text style={styles.cancelProductButtonText}>
                  Cancelar y Escanear Otro
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
         */}

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
