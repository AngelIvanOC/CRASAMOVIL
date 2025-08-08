import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import InputProducto from "../moleculas/InputProducto";

const FormularioAgregarProducto = ({
  marca,
  onSubmit,
  onCancel,
  loading,
  codigoproducto,
  nombre,
}) => {
  const [formData, setFormData] = useState({
    codigo: codigoproducto ? codigoproducto : "",
    nombre: nombre ? String(nombre) : "",
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.codigo.trim()) {
      newErrors.codigo = "El código del producto es requerido";
    } else if (!/^\d+$/.test(formData.codigo.trim())) {
      newErrors.codigo = "El código debe contener solo números";
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre del producto es requerido";
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const dataToSubmit = {
      codigo: parseInt(formData.codigo.trim()),
      nombre: formData.nombre.trim(),
      marca_id: marca.id,
      cajas: 0,
      cantidad: 0,
      racks: null,
    };

    onSubmit(dataToSubmit);
  };

  const isFormValid = formData.codigo.trim() && formData.nombre.trim();

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <InputProducto
          label="Código del Producto"
          value={formData.codigo}
          onChangeText={(text) => handleInputChange("codigo", text)}
          placeholder="Ingresa el código del producto"
          keyboardType="numeric"
          error={errors.codigo}
          required
        />

        <InputProducto
          label="Nombre del Producto"
          value={formData.nombre}
          onChangeText={(text) => handleInputChange("nombre", text)}
          placeholder="Ingresa el nombre del producto"
          error={errors.nombre}
          required
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormValid || loading) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Agregar Producto</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingTop: 20,
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#023E8A",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#023E8A",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#023E8A",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});

export default FormularioAgregarProducto;
