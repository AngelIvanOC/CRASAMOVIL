import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import CustomAlert from "../atomos/Alertas/CustomAlert";

const ProductoEscaneadoForm = ({
  productoEncontrado,
  onConfirmEntrada,
  onCancel,
  rackSugerido,
  racksDisponibles,
  onRackChange,
  updating = false,
  setUpdating,
}) => {
  const [cantidadManual, setCantidadManual] = useState("");
  const [fechaCaducidadManual, setFechaCaducidadManual] = useState("");
  const [codigoBarrasManual, setCodigoBarrasManual] = useState("");
  const [tipoUbicacion, setTipoUbicacion] = useState("rack");
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [espaciosDisponibles, setEspaciosDisponibles] = useState(0);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertProps, setAlertProps] = useState({
    title: "",
    message: "",
    buttons: [],
  });

  const isCrasa =
    productoEncontrado?.marca_id === 1 ||
    productoEncontrado?.marca?.nombre?.toUpperCase() === "CRASA";

  useEffect(() => {
    if (productoEncontrado) {
      setCantidadManual(
        productoEncontrado.cantidadEscaneada?.toString() || "0"
      );
      setFechaCaducidadManual(
        productoEncontrado.fechaCaducidad
          ? productoEncontrado.fechaCaducidad instanceof Date
            ? productoEncontrado.fechaCaducidad.toISOString().split("T")[0]
            : productoEncontrado.fechaCaducidad
          : ""
      );
      setCodigoBarrasManual(productoEncontrado.codigoBarras || "");

      const espaciosLibres = racksDisponibles.length;

      const isCrasa =
        productoEncontrado?.marca_id === 1 ||
        productoEncontrado?.marca?.nombre?.toUpperCase() === "CRASA";

      if (isCrasa) {
        setTipoUbicacion("piso");
        setShowLocationAlert(false);
      } else {
        setEspaciosDisponibles(espaciosLibres);

        if (espaciosLibres === 0) {
          setTipoUbicacion("suelto");
          showAlert({
            title: "Sin espacios en racks",
            message:
              "No hay espacios disponibles en los racks. Puedes ubicar el producto como suelto o en piso.",
            buttons: [
              {
                text: "Entendido",
                onPress: () => setAlertVisible(false),
              },
            ],
          });
        } else {
          setShowLocationAlert(true);
        }
      }
    }
  }, [productoEncontrado]);

  const showAlert = ({ title, message, buttons = [] }) => {
    setAlertProps({ title, message, buttons });
    setAlertVisible(true);

    if (buttons.length === 0) {
      setTimeout(() => {
        setAlertVisible(false);
      }, 4000);
    }
  };

  const validateFields = () => {
    const errors = [];

    if (!codigoBarrasManual || codigoBarrasManual.trim() === "") {
      errors.push("• Código de barras");
    }

    if (!fechaCaducidadManual || fechaCaducidadManual.trim() === "") {
      errors.push("• Fecha de caducidad");
    } else {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fechaCaducidadManual)) {
        errors.push("• Fecha de caducidad debe tener formato YYYY-MM-DD");
      } else {
        const fecha = new Date(fechaCaducidadManual);
        if (isNaN(fecha.getTime())) {
          errors.push("• Fecha de caducidad no es válida");
        }
      }
    }

    if (!cantidadManual || cantidadManual.trim() === "") {
      errors.push("• Cantidad");
    } else {
      const cantidad = parseInt(cantidadManual);
      if (isNaN(cantidad) || cantidad <= 0) {
        errors.push("• Cantidad debe ser mayor a 0");
      }
    }

    if (tipoUbicacion === "rack" && !rackSugerido) {
      errors.push("• Debe seleccionar un rack disponible");
    }

    return errors;
  };

  const handleConfirm = async () => {
    const errors = validateFields();

    if (errors.length > 0) {
      showAlert({
        title: "Campos Obligatorios",
        message: `\n${errors.join("\n")}\n`,
        buttons: [
          {
            text: "OK",
            onPress: () => setAlertVisible(false),
          },
        ],
      });
      return;
    }

    const cantidadFinal = parseInt(cantidadManual);
    const ubicacion =
      tipoUbicacion === "suelto" ? "SUELTO" : rackSugerido?.codigo_rack;

    try {
      setUpdating(true);

      const datosCompletos = {
        ...productoEncontrado,
        cantidadEscaneada: cantidadFinal,
        codigoBarras: codigoBarrasManual,
        fechaCaducidad: fechaCaducidadManual,
        tipoUbicacion: tipoUbicacion,
        rackAsignado: tipoUbicacion === "rack" ? rackSugerido : null,
      };

      onConfirmEntrada(datosCompletos, cantidadFinal);
    } catch (error) {
      showAlert({
        title: "Error",
        message: `No se pudo procesar: ${error.message}`,
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

  const handleRackSelection = () => {
    if (racksDisponibles.length === 0) {
      showAlert({
        title: "Sin racks",
        message: "No hay racks disponibles para esta marca",
        buttons: [
          {
            text: "OK",
            onPress: () => setAlertVisible(false),
          },
        ],
      });
      return;
    }

    Alert.alert(
      "Seleccionar Rack",
      "Elige un rack disponible:",
      racksDisponibles.map((rack) => ({
        text: `${rack.codigo_rack}`,
        onPress: () => onRackChange(rack),
      }))
    );
  };

  if (!productoEncontrado) return null;

  const handleLocationSelection = (ubicacion) => {
    setTipoUbicacion(ubicacion);
    setShowLocationAlert(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Información del Producto Escaneado</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre del Producto:</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={productoEncontrado.nombre || ""}
            editable={false}
            placeholder="Nombre del producto"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Código del Producto:</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={productoEncontrado.codigo?.toString() || ""}
            editable={false}
            placeholder="Código del producto"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, styles.requiredLabel]}>
            Código de Barras: <Text style={styles.asterisk}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={codigoBarrasManual}
            onChangeText={setCodigoBarrasManual}
            placeholder="Código de barras escaneado"
            multiline={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, styles.requiredLabel]}>
            Fecha de Caducidad: <Text style={styles.asterisk}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={fechaCaducidadManual}
            onChangeText={setFechaCaducidadManual}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, styles.requiredLabel]}>
            Tipo de Ubicación: <Text style={styles.asterisk}>*</Text>
          </Text>
          <View style={styles.pickerContainer}>
            <TouchableOpacity
              style={[
                styles.pickerOption,
                tipoUbicacion === "rack" && styles.pickerOptionSelected,
                isCrasa && styles.disabledOption,
              ]}
              onPress={isCrasa ? null : () => setTipoUbicacion("rack")}
              disabled={isCrasa}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  tipoUbicacion === "rack" && styles.pickerOptionTextSelected,
                  isCrasa && styles.disabledOption,
                ]}
              >
                Rack
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pickerOption,
                tipoUbicacion === "piso" && styles.pickerOptionSelected,
              ]}
              onPress={() => setTipoUbicacion("piso")}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  tipoUbicacion === "piso" && styles.pickerOptionTextSelected,
                ]}
              >
                Piso
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pickerOption,
                tipoUbicacion === "suelto" && styles.pickerOptionSelected,
                isCrasa && styles.disabledOption,
              ]}
              onPress={isCrasa ? null : () => setTipoUbicacion("suelto")}
              disabled={isCrasa}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  tipoUbicacion === "suelto" && styles.pickerOptionTextSelected,
                  isCrasa && styles.disabledOption,
                ]}
              >
                Suelto
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {tipoUbicacion === "rack"
              ? "Rack Asignado:"
              : tipoUbicacion === "piso"
                ? "Ubicación:"
                : "Ubicación:"}
            {tipoUbicacion === "rack" && (
              <Text style={styles.asterisk}> *</Text>
            )}
          </Text>
          <View style={styles.rackContainer}>
            <TextInput
              style={[styles.input, styles.readOnlyInput, { flex: 1 }]}
              value={
                tipoUbicacion === "rack"
                  ? rackSugerido
                    ? `${rackSugerido.codigo_rack}`
                    : "No hay racks disponibles"
                  : tipoUbicacion === "piso"
                    ? "Producto en Piso"
                    : "Producto Suelto - Sin ubicación específica"
              }
              editable={false}
              placeholder="Ubicación del producto"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, styles.requiredLabel]}>
            Cantidad a Agregar al Inventario:{" "}
            <Text style={styles.asterisk}>*</Text>
          </Text>
          <Text style={styles.helperText}>
            Cantidad detectada: {productoEncontrado.cantidadEscaneada || 0}
          </Text>
          <TextInput
            style={styles.input}
            value={cantidadManual}
            onChangeText={setCantidadManual}
            placeholder="Cantidad a agregar"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Resumen de la Entrada:</Text>
          <Text style={styles.summaryText}>
            Stock actual: {productoEncontrado.cantidad || 0}
          </Text>
          <Text style={styles.summaryText}>
            Cantidad a agregar: {cantidadManual || 0}
          </Text>
          <Text style={styles.summaryText}>
            Stock después de la entrada:{" "}
            {(productoEncontrado.cantidad || 0) +
              (parseInt(cantidadManual) || 0)}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={updating}
          >
            <Text style={styles.confirmButtonText}>
              {updating ? "Procesando..." : "Confirmar Entrada"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={updating}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CustomAlert
        visible={showLocationAlert}
        title="Ubicacion del producto"
        message={`¿Donde ubicaras "${productoEncontrado?.nombre || ""}"?`}
        buttons={[
          {
            text: `Rack (${espaciosDisponibles} libres)`,
            onPress: () => handleLocationSelection("rack"),
          },
          {
            text: "Piso",
            onPress: () => handleLocationSelection("piso"),
          },
          {
            text: "Suelto",
            onPress: () => handleLocationSelection("suelto"),
          },
        ]}
        onClose={() => setShowLocationAlert(false)}
      />

      <CustomAlert
        visible={alertVisible}
        title={alertProps.title}
        message={alertProps.message}
        buttons={alertProps.buttons}
        onClose={() => setAlertVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
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
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#023E8A",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  requiredLabel: {
    color: "#333",
  },
  asterisk: {
    color: "#dc3545",
    fontSize: 16,
    fontWeight: "bold",
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontStyle: "italic",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  readOnlyInput: {
    backgroundColor: "#f0f0f0",
    color: "#666",
  },
  highlightedInput: {
    borderColor: "#023E8A",
    borderWidth: 2,
    backgroundColor: "#f0f8ff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  rackContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  changeRackButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changeRackButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  summaryContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#023E8A",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#023E8A",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 16,
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
  pickerContainer: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  pickerOptionSelected: {
    backgroundColor: "#023E8A",
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  pickerOptionTextSelected: {
    color: "white",
    fontWeight: "bold",
  },

  disabledOption: {
    backgroundColor: "#e0e0e0",
    opacity: 0.6,
  },
  disabledOptionText: {
    color: "#9e9e9e",
  },
});

export default ProductoEscaneadoForm;
