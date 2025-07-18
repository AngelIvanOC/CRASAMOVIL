import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

const InputProducto = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  error,
  required = false,
  multiline = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  required: {
    color: "#e74c3c",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  inputError: {
    borderColor: "#e74c3c",
  },
  errorText: {
    fontSize: 14,
    color: "#e74c3c",
    marginTop: 5,
  },
});

export default InputProducto;
