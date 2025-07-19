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

const ProductoEscaneadoForm = ({
  productoEncontrado,
  onConfirmEntrada,
  onCancel,
  rackSugerido,
  racksDisponibles,
  onRackChange,
  updating = false,
}) => {
  // Estados para los campos editables
  const [cantidadManual, setCantidadManual] = useState("");
  const [fechaCaducidadManual, setFechaCaducidadManual] = useState("");
  const [codigoBarrasManual, setCodigoBarrasManual] = useState("");

  // Actualizar estados cuando cambie el producto
  useEffect(() => {
    if (productoEncontrado) {
      setCantidadManual(
        productoEncontrado.cantidadEscaneada?.toString() || "1"
      );
      setFechaCaducidadManual(
        productoEncontrado.fechaCaducidad
          ? productoEncontrado.fechaCaducidad instanceof Date
            ? productoEncontrado.fechaCaducidad.toISOString().split("T")[0]
            : productoEncontrado.fechaCaducidad
          : ""
      );
      setCodigoBarrasManual(productoEncontrado.codigoBarras || "");
    }
  }, [productoEncontrado]);

  const handleConfirm = () => {
    const cantidadFinal = parseInt(cantidadManual) || 1;

    if (cantidadFinal <= 0) {
      Alert.alert("Error", "La cantidad debe ser mayor a 0");
      return;
    }

    // Crear objeto con todos los datos editables
    const datosCompletos = {
      ...productoEncontrado,
      cantidadEscaneada: cantidadFinal, // Usar la cantidad del input
      codigoBarras: codigoBarrasManual,
      fechaCaducidad: fechaCaducidadManual || null,
      datosOCR: {
        ...productoEncontrado.datosOCR,
        cantidad: cantidadFinal, // Usar la misma cantidad
      },
    };

    onConfirmEntrada(datosCompletos, cantidadFinal);
  };

  const handleRackSelection = () => {
    if (racksDisponibles.length === 0) {
      Alert.alert("Sin racks", "No hay racks disponibles para esta marca");
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Información del Producto Escaneado</Text>

        {/* Campos NO editables */}
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

        {/*<View style={styles.inputContainer}>
          <Text style={styles.label}>Stock Actual:</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={productoEncontrado.cantidad?.toString() || "0"}
            editable={false}
            placeholder="Stock actual"
          />
        </View>*/}

        {/*<View style={styles.inputContainer}>
          <Text style={styles.label}>Marca:</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={productoEncontrado.marcas?.nombre || "N/A"}
            editable={false}
            placeholder="Marca"
          />
        </View>*/}

        {/* Campos EDITABLES */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Código de Barras:</Text>
          <TextInput
            style={styles.input}
            value={codigoBarrasManual}
            onChangeText={setCodigoBarrasManual}
            placeholder="Código de barras escaneado"
            multiline={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Fecha de Caducidad:</Text>
          <TextInput
            style={styles.input}
            value={fechaCaducidadManual}
            onChangeText={setFechaCaducidadManual}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {/* Selección de Rack */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ingresar en el Rack:</Text>
          <View style={styles.rackContainer}>
            <TextInput
              style={[styles.input, styles.readOnlyInput, { flex: 1 }]}
              value={
                rackSugerido
                  ? `${rackSugerido.codigo_rack}`
                  : "No hay racks disponibles"
              }
              editable={false}
              placeholder="Rack asignado"
            />
            {/*<TouchableOpacity
              style={styles.changeRackButton}
              onPress={handleRackSelection}
              disabled={racksDisponibles.length === 0}
            >
              <Text style={styles.changeRackButtonText}>Cambiar</Text>
            </TouchableOpacity>*/}
          </View>
        </View>

        {/* CAMPO ÚNICO DE CANTIDAD */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Cantidad a Agregar al Inventario:</Text>
          <Text style={styles.helperText}>
            Cantidad detectada: {productoEncontrado.cantidadEscaneada || 1}
          </Text>
          <TextInput
            style={[styles.input, styles.highlightedInput]}
            value={cantidadManual}
            onChangeText={setCantidadManual}
            placeholder="Cantidad a agregar"
            keyboardType="numeric"
          />
        </View>

        {/* Resumen de la operación */}
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

        {/* Botones de acción */}
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
            <Text style={styles.cancelButtonText}>
              Cancelar y Escanear Otro
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
});

export default ProductoEscaneadoForm;
