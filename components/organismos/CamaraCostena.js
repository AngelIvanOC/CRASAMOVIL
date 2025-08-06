// CamaraCostena.js - Versión con compresión mejorada para Android
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from "react-native";
import { CameraView } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

const CamaraCostena = ({ onProductoDetectado }) => {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const cameraRef = useRef(null);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setLoading(true);
    setDebugInfo("📸 Tomando foto...");

    try {
      // 🔹 CONFIGURACIÓN OPTIMIZADA POR PLATAFORMA
      const photoConfig = {
        quality: Platform.OS === "android" ? 0.4 : 0.7, // Menor calidad inicial en Android
        base64: false,
        skipProcessing: false, // Asegura procesamiento consistente
      };

      const photo = await cameraRef.current.takePictureAsync(photoConfig);

      setPhoto(photo.uri);
      setDebugInfo("🔧 Optimizando imagen para OCR...");

      const optimizedImage = await optimizeImageForOCR(photo.uri);
      setDebugInfo("✅ Imagen optimizada, procesando OCR...");

      await processOCRWithOCRSpace(optimizedImage);
    } catch (error) {
      console.error("Error al tomar la foto:", error);
      setDebugInfo(`❌ Error: ${error.message}`);
      Alert.alert("Error", `No se pudo procesar la imagen: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 NUEVA FUNCIÓN: Optimización inteligente por plataforma
  const optimizeImageForOCR = async (imageUri) => {
    try {
      // Verificar tamaño inicial
      const initialFileInfo = await FileSystem.getInfoAsync(imageUri);
      const initialSizeKB = initialFileInfo.size / 1024;

      console.log(
        `📊 Tamaño inicial: ${initialSizeKB.toFixed(2)} KB - Plataforma: ${Platform.OS}`
      );

      // 🔹 CONFIGURACIÓN ESPECÍFICA POR PLATAFORMA
      const platformConfig = {
        android: {
          targetSizeKB: 600, // Más conservador para Android
          maxSizeKB: 700,
          initialResize: 1100, // Resolución inicial más baja
          compression: 0.5, // Compresión más agresiva
        },
        ios: {
          targetSizeKB: 600,
          maxSizeKB: 700,
          initialResize: 1200,
          compression: 0.5,
        },
      };

      const config = platformConfig[Platform.OS] || platformConfig.android;

      // Si ya está en el tamaño objetivo, usar directamente
      if (initialSizeKB <= config.targetSizeKB) {
        console.log("✅ Imagen ya tiene el tamaño adecuado");
        return imageUri;
      }

      // 🔹 PASO 1: Redimensionado y compresión inicial agresiva
      let result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: config.initialResize } }],
        {
          compress: config.compression,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      let fileInfo = await FileSystem.getInfoAsync(result.uri);
      let fileSizeKB = fileInfo.size / 1024;
      console.log(
        `📉 Después de primera optimización: ${fileSizeKB.toFixed(2)} KB`
      );

      // 🔹 PASO 2: Compresión adicional si es necesario
      if (fileSizeKB > config.maxSizeKB) {
        result = await ImageManipulator.manipulateAsync(
          result.uri,
          [
            { resize: { width: 700 } }, // Resolución mínima pero funcional para OCR
          ],
          {
            compress: 0.2, // Compresión máxima
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        fileInfo = await FileSystem.getInfoAsync(result.uri);
        fileSizeKB = fileInfo.size / 1024;
        console.log(
          `📉 Después de segunda optimización: ${fileSizeKB.toFixed(2)} KB`
        );
      }

      // 🔹 PASO 3: Verificación final - Solo si es absolutamente necesario
      if (fileSizeKB > config.maxSizeKB + 100) {
        result = await ImageManipulator.manipulateAsync(
          result.uri,
          [
            { resize: { width: 600 } }, // Último recurso
          ],
          {
            compress: 0.1,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        const finalFileInfo = await FileSystem.getInfoAsync(result.uri);
        console.log(
          `📉 Optimización final: ${(finalFileInfo.size / 1024).toFixed(2)} KB`
        );
      }

      return result.uri;
    } catch (error) {
      console.error("❌ Error al optimizar imagen:", error);
      throw error;
    }
  };

  // ✅ TODAS LAS FUNCIONES DE PARSING SE MANTIENEN INTACTAS
  const parseCosteñaProduct = (text) => {
    const cleanText = text.replace(/\s+/g, " ").trim();

    // Detectar si es producto Costeña
    if (cleanText.includes("JUMEX")) {
      return parseCosteñaProducts(cleanText);
    } else {
      // Asumir que es Jumex u otra marca
      return parseJumexProduct(cleanText);
    }
  };

  const parseCosteñaProducts = (text) => {
    const product = {
      fechaCaducidad: null,
      descripcion: null,
      codigo: null,
      codigoBarras: null,
      cantidad: 1,
    };

    const cleanText = text.replace(/\s+/g, " ").trim();

    // Extraer fecha de caducidad (formato d.m.yyyy)
    const expiraRegex = /EXPIRA:\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/i;
    const expiraMatch = cleanText.match(expiraRegex);
    if (expiraMatch) {
      const day = parseInt(expiraMatch[1]);
      const month = parseInt(expiraMatch[2]) - 1;
      const year = parseInt(expiraMatch[3]);
      product.fechaCaducidad = new Date(year, month, day);
    }

    // Extraer código de producto
    const codigoProductoRegex = /\b(\d{5,7})\b/;
    const codigoProductoMatch = cleanText.match(codigoProductoRegex);
    if (codigoProductoMatch) product.codigo = codigoProductoMatch[1];

    // Extraer código de barras
    const codigoRegex = /\b(\d{10,12})\b/;
    const codigoMatch = cleanText.match(codigoRegex);
    if (codigoMatch) product.codigoBarras = codigoMatch[1];

    // Extraer descripción
    const descripcionPatterns = [
      /DESCRIPCION\s*(.+?)(?=\d{6,}|$)/i,
      /DESORIPCION\s*(.+?)(?=\d{6,}|$)/i,
      /(Frutastica[^0-9]{1,50})/i,
      /(Chiles[^0-9]{1,50})/i,
      /(Salsa[^0-9]{1,50})/i,
      /(Frijoles[^0-9]{1,50})/i,
    ];

    for (const pattern of descripcionPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        product.descripcion = match[1].trim();
        break;
      }
    }

    // Extraer cantidad
    const cantidadRegex = /\b(\d{1,6})\s*CA\b/;
    const cantidadMatch = cleanText.match(cantidadRegex);
    if (cantidadMatch) {
      product.cantidad = parseInt(cantidadMatch[1]);
    }

    return product;
  };

  const parseJumexProduct = (text) => {
    console.log(cleanText);

    const product = {
      fecha: null,
      fechaCaducidad: null,
      descripcion: null,
      codigo: null,
      codigoBarras: null,
      cantidad: 1,
    };

    const cleanText = text.replace(/\s+/g, " ").trim();

    // Extraer primera fecha encontrada
    const allDatesRegex = /(\d{2})\/(\d{2})\/(\d{4})/g;
    const allDatesMatch = [...cleanText.matchAll(allDatesRegex)];

    if (allDatesMatch.length > 0) {
      const [day, month, year] = allDatesMatch[0].slice(1).map(Number);
      product.fecha = new Date(year, month - 1, day);
    }

    // Extraer fecha de caducidad Jumex
    const fechaCaducidadRegex =
      /FECHA CADUCIDAD:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i;
    const fechaCaducidadMatch = cleanText.match(fechaCaducidadRegex);

    if (fechaCaducidadMatch) {
      const day = parseInt(fechaCaducidadMatch[1]);
      const month = parseInt(fechaCaducidadMatch[2]) - 1;
      const year = parseInt(fechaCaducidadMatch[3]);
      product.fechaCaducidad = new Date(year, month, day);
    }

    // Extraer código de producto Jumex
    const codigoAfterKeywordRegex = /\s+[A-Z\s]*?(\d{6})/i;
    const codigoAfterKeywordMatch = cleanText.match(codigoAfterKeywordRegex);

    if (codigoAfterKeywordMatch) {
      product.codigo = String(parseInt(codigoAfterKeywordMatch[1], 10));
    } else {
      const codigoFallbackRegex = /\b(000\d{3})\b/;
      const codigoFallbackMatch = cleanText.match(codigoFallbackRegex);
      if (codigoFallbackMatch)
        product.codigo = String(parseInt(codigoFallbackMatch[1], 10));
    }

    // Extraer descripción Jumex
    const descripcionJumexPatterns = [
      /(PURE DE TOMATE)/i,
      /(FRIJOLES BAY REF)/i,
      /(RAJAS DE JALAPEÑO)/i,
      /(ENVASADO DE CHILES)/i,
      /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{8,40}?)(?=\s*(?:CAJA|COND))/i,
    ];

    for (const pattern of descripcionJumexPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        product.descripcion = match[1].trim();
        break;
      }
    }

    // Extraer cantidad Jumex
    const cantidadJumexContextRegex = /cantidad\D*(\d{2,6})\D*(\d{2,6})/i;
    const cantidadJumexMatch = cleanText.match(cantidadJumexContextRegex);

    if (cantidadJumexMatch && cantidadJumexMatch[2]) {
      product.cantidad = parseInt(cantidadJumexMatch[2], 10);
    }

    // Extraer código de barras (para más de 15 dígitos)
    const codigoBarrasRegex = /\b(\d{15,})\b/;
    const codigoBarrasMatch = cleanText.match(codigoBarrasRegex);
    if (codigoBarrasMatch) product.codigoBarras = codigoBarrasMatch[1];

    // Formatear código de barras
    /*if (product.codigo && product.cantidad && product.fecha) {
      const codigo7 = product.codigo.toString().padStart(7, "0");
      const cantidad5 = product.cantidad.toString().padStart(5, "0");

      const year = product.fecha.getFullYear().toString().slice(-2);
      const month = String(product.fecha.getMonth() + 1).padStart(2, "0");
      const day = String(product.fecha.getDate()).padStart(2, "0");

      const fechaFormateada = `${year}${month}${day}`;

      product.codigoBarras = `${codigo7}${cantidad5}${fechaFormateada}`;
    }*/
    return product;
  };

  const processOCRWithOCRSpace = async (imageUri) => {
    try {
      setDebugInfo("🔍 Procesando con OCR.space...");

      // 🔹 VERIFICACIÓN DE TAMAÑO MÁS PERMISIVA
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const fileSizeKB = fileInfo.size / 1024;

      console.log(`📊 Tamaño final para OCR: ${fileSizeKB.toFixed(2)} KB`);

      // Límite más alto pero con mejor manejo de errores
      if (fileSizeKB > 800) {
        throw new Error(
          `Imagen aún demasiado grande (${fileSizeKB.toFixed(0)}KB). Intenta con mejor iluminación.`
        );
      }

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const base64Data = `data:image/jpeg;base64,${base64}`;
      const formData = new FormData();
      formData.append("base64Image", base64Data);
      formData.append("language", "spa");
      formData.append("isOverlayRequired", "false");
      formData.append("OCREngine", "2");
      formData.append("filetype", "JPG");

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: "K84583473088957",
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const result = await response.json();

      if (result.IsErroredOnProcessing) {
        throw new Error(result.ErrorMessage || "Error en el servicio OCR");
      }

      if (!result.ParsedResults?.[0]?.ParsedText) {
        throw new Error("No se detectó texto en la imagen");
      }

      const extractedText = result.ParsedResults[0].ParsedText.trim();
      console.log("📝 Texto detectado por OCR:", extractedText);

      const productData = parseCosteñaProduct(extractedText);

      if (!productData.codigo) {
        throw new Error("No se pudo identificar el código del producto");
      }

      onProductoDetectado(productData);
      setDebugInfo("✅ Producto detectado");
    } catch (error) {
      console.error("Error en OCR.space:", error);
      setDebugInfo(`❌ Error: ${error.message}`);

      Alert.alert(
        "No se pudo procesar la imagen",
        "¿Deseas ingresar manualmente todos los datos?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Entrada Manual",
            onPress: () => {
              const productoManual = {
                codigo: null,
                descripcion: null,
                fechaCaducidad: null,
                codigoBarras: null,
                cantidad: 1,
              };
              onProductoDetectado(productoManual);
            },
          },
        ]
      );

      return;
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />

      <View style={styles.overlay}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        <Text style={styles.instructionsText}>
          Enfoca la etiqueta del producto dentro del marco
        </Text>

        {/* 🔹 INDICADOR DE PLATAFORMA PARA DEBUG 
        {__DEV__ && (
          <Text style={styles.platformText}>Plataforma: {Platform.OS}</Text>
        )}*/}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={takePicture}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.scanButtonText}>ESCANEAR ETIQUETA</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.debugText}>{debugInfo}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: "80%",
    height: "40%",
    position: "relative",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#023E8A",
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionsText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 10,
    borderRadius: 10,
  },
  platformText: {
    color: "yellow",
    fontSize: 12,
    marginTop: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 5,
    borderRadius: 5,
  },
  controls: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: "#023E8A",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 10,
  },
  scanButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  debugText: {
    color: "white",
    fontSize: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 5,
    borderRadius: 5,
  },
});

export default CamaraCostena;
