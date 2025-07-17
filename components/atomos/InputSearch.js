import React from "react";
import { TextInput, StyleSheet } from "react-native";

const InputSearch = ({ value, onChangeText, placeholder }) => {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      returnKeyType="search"
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
});

export default InputSearch;
