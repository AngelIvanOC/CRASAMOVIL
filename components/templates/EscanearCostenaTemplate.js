// EscanearCostenaTemplate.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useCameraPermissions } from "expo-camera";
import { useProductos } from "../../hooks/useProductos";
import { useRacks } from "../../hooks/useRacks";
import CamaraCostena from "../organismos/CamaraCostena"; // Componente que crearemos después
import CustomAlert from "../atomos/Alertas/CustomAlert";
import ProductoEscaneadoForm from "../organismos/ProductoEscaneadoForm";
import ValidacionRackQR from "../organismos/ValidacionRackQR"; // Componente que crearemos después

const EscanearCostenaTemplate = ({ navigation, onEntradaComplete, marca }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [updating, setUpdating] = useState(false);
  const [productoEncontrado, setProductoEncontrado] = useState(null);
  const [cantidadManual, setCantidadManual] = useState("1");
  const [racksDisponibles, setRacksDisponibles] = useState([]);
  const [rackSugerido, setRackSugerido] = useState(null);
  const [esperandoValidacionRack, setEsperandoValidacionRack] = useState(false);
  const [datosParaConfirmar, setDatosParaConfirmar] = useState(null);

  
  const { obtenerRacksDisponiblesPorMarca } = useRacks();
  const {
    productos,
    fetchProductos,
    procesarEntradaCompleta,
    verificarCodigoBarrasUnico,
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

  // En EscanearCostenaTemplate.js, actualiza handleProductoDetectado
  const handleProductoDetectado = async (productoData) => {
    if (!productoData.codigo) {
      const racks = await obtenerRacksDisponiblesPorMarca(marca.id);
      setRacksDisponibles(racks);
      setRackSugerido(racks.length > 0 ? racks[0] : null);

      // Producto temporal para entrada manual
      setProductoEncontrado({
        id: null, // Sin ID porque no existe en BD
        codigo: "", // Código vacío para que el usuario lo llene
        nombre: "", // Nombre vacío
        cantidad: 0, // Stock actual 0
        marca_id: marca.id,
        cantidadEscaneada: productoData.cantidad || 1,
        codigoBarras: productoData.codigoBarras || "",
        fechaCaducidad: productoData.fechaCaducidad,
        datosOCR: productoData,
        esEntradaManual: true, // Flag para identificar entrada manual
      });

      setCantidadManual(productoData.cantidad?.toString() || "1");
      return;
    }

    try {
      // Buscar el producto en la base de datos por código
      const producto = productos.find(
        (p) => String(p.codigo).trim() === String(productoData.codigo).trim()
      );

      if (!producto) {
        /*Alert.alert(
          "Producto no registrado",
          `El producto con código ${productoData.codigo} no está registrado. ¿Deseas crearlo?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Crear producto",
              onPress: () => {
                navigation.navigate("CrearProducto", {
                  datosIniciales: {
                    codigo: productoData.codigo,
                    nombre:
                      productoData.descripcion ||
                      `Producto ${productoData.codigo}`,
                    marca_id: marca.id,
                  },
                });
              },
            },
          ]
        );*/

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

      // Solo verificar código de barras si el producto existe y hay código
      if (productoData.codigoBarras) {
        const esUnico = await verificarCodigoBarrasUnico(
          productoData.codigoBarras
        );
        if (!esUnico) {
          Alert.alert(
            "Código ya registrado",
            "Este código de barras ya fue escaneado anteriormente",
            [
              {
                text: "Entendido",
                onPress: () => setProductoEncontrado(null),
              },
            ]
          );
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
      Alert.alert("Error", "No se pudo procesar el producto detectado");
    }
  };
  const handleConfirmEntrada = (datosCompletos, cantidadFinal) => {
    /*if (!productoEncontrado) return;

    const cantidadFinal = parseInt(cantidadManual) || 1;

    if (cantidadFinal <= 0) {
      Alert.alert("Error", "La cantidad debe ser mayor a 0");
      return;
    }*/

    setDatosParaConfirmar({ datosCompletos, cantidadFinal });
    setEsperandoValidacionRack(true);

    /*Alert.alert(
      "Confirmar Entrada",
      `¿Confirmas la entrada de ${cantidadFinal} unidades del producto "${datosCompletos.nombre}"?`,
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
    if (!rackSugerido) {
      Alert.alert("Error", "No hay rack seleccionado");
      setEsperandoValidacionRack(false);
      return;
    }

    // Comparar el código escaneado con el rack sugerido
    if (codigoQREscaneado === rackSugerido.codigo_rack) {
      // Código correcto, proceder con la entrada
      Alert.alert(
        "¡Rack Validado!",
        `Confirmas la entrada de ${datosParaConfirmar.cantidadFinal} unidades del producto "${datosParaConfirmar.datosCompletos.nombre}" en el rack ${rackSugerido.codigo_rack}?`,
        [
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => setEsperandoValidacionRack(false),
          },
          {
            text: "Confirmar",
            onPress: async () => {
              setEsperandoValidacionRack(false);
              await procesarEntrada(
                datosParaConfirmar.datosCompletos,
                datosParaConfirmar.cantidadFinal
              );
            },
          },
        ]
      );
    } else {
      // Código incorrecto
      Alert.alert(
        "Rack Incorrecto",
        `El código escaneado (${codigoQREscaneado}) no coincide con el rack asignado (${rackSugerido.codigo_rack}). Por favor, escanea el código QR del rack correcto.`,
        [
          { text: "Reintentar", onPress: () => {} }, // Se queda esperando el QR correcto
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => setEsperandoValidacionRack(false),
          },
        ]
      );
    }
  };

  // En EscanearCostenaTemplate.js, actualiza procesarEntrada:

  const procesarEntrada = async (datosCompletos, cantidad) => {
    try {
      setUpdating(true);
      await procesarEntradaCompleta(
        datosCompletos.id,
        cantidad,
        datosCompletos.codigoBarras,
        rackSugerido?.id || null,
        datosCompletos.fechaCaducidad
      );

      Alert.alert(
        "¡Entrada Registrada!",
        `Se han agregado ${cantidad} unidades del producto "${datosCompletos.nombre}"`,
        [
          {
            text: "Continuar",
            onPress: () => {
              setProductoEncontrado(null);
              setCantidadManual("1");
            },
          },
          {
            text: "Finalizar",
            onPress: () => {
              if (onEntradaComplete) {
                onEntradaComplete();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error procesando entrada:", error);

      if (error.message.includes("ya fue registrado")) {
        Alert.alert(
          "Código duplicado",
          "La etiqueta escaneada ya fue registrada. Por favor verifica:",
          [
            {
              text: "Ver detalles",
              onPress: () => {
                navigation.navigate("HistorialEntradas", {
                  producto: productoEncontrado,
                });
              },
            },
            {
              text: "Continuar",
              style: "cancel",
              onPress: () => setProductoEncontrado(null),
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          `No se pudo procesar la entrada: ${error.message}`
        );
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
      {/* Cámara especial para La Costeña */}
      {!productoEncontrado && (
        <CamaraCostena onProductoDetectado={handleProductoDetectado} />
      )}

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
        />
      )}

      {/* Controles 
      <View style={styles.controlsContainer}>
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
              style={styles.cancelButton}
              onPress={handleCancelProducto}
              disabled={updating}
            >
              <Text style={styles.cancelButtonText}>
                Escanear otro producto
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
  productInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  cantidadContainer: {
    marginTop: 12,
    marginBottom: 12,
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
  confirmButton: {
    backgroundColor: "#28a745",
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
