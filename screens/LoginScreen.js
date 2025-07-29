import { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import CustomAlert from "../components/atomos/Alertas/CustomAlert";

const LoginScreen = () => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Estado para controlar visibilidad

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertProps, setAlertProps] = useState({
    title: "",
    message: "",
    buttons: [],
  });

  const showAlert = ({ title, message, buttons }) => {
    setAlertProps({ title, message, buttons });
    setAlertVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor={"#000"}
        autoCapitalize="none"
        onChangeText={setUsername}
      />

      {/* Contenedor para el input de contraseña y el botón */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Contraseña"
          placeholderTextColor={"#000"}
          secureTextEntry={!showPassword} // Controla la visibilidad
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={styles.eyeText}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          login(username, password, (errorMessage) =>
            showAlert({
              title: "Error de inicio de sesión",
              message: "Usuario o contraseña incorrectos" || errorMessage,
              buttons: [{ text: "OK", onPress: () => setAlertVisible(false) }],
            })
          )
        }
      >
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: {
    width: "80%",
    height: 40,
    borderWidth: 1,
    marginVertical: 10,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    color: "#000",
  },
  // Contenedor para el input de contraseña y el botón del ojo
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    marginVertical: 10,
    color: "#000",
  },
  // Input de contraseña que ocupa la mayor parte del espacio
  passwordInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    color: "#000",
  },
  // Botón del ojo
  eyeButton: {
    height: 40,
    width: 40,
    borderWidth: 1,
    borderLeftWidth: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  eyeText: {
    fontSize: 18,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

export default LoginScreen;
