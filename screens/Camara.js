import React, { useState, useRef } from "react";
import { View, Button, Image, Text, Alert, ScrollView } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

export default function Camara() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [textOCR, setTextOCR] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const [parsedProduct, setParsedProduct] = useState(null);
  const cameraRef = useRef(null);

  React.useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setLoading(true);
    setDebugInfo("📸 Tomando foto...");

    // Limpiar estados previos
    setTextOCR("");
    setParsedProduct(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      setPhoto(photo.uri);
      setDebugInfo("🔧 Comprimiendo imagen...");

      const compressedImage = await compressImageForOCR(photo.uri);
      setDebugInfo("✅ Imagen comprimida, procesando OCR...");

      // Agregar timeout para evitar que se quede colgado
      await Promise.race([
        processOCRWithOCRSpace(compressedImage),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout: OCR tardó más de 30 segundos")),
            30000
          )
        ),
      ]);
    } catch (error) {
      console.error("Error al tomar la foto:", error);
      setDebugInfo(`❌ Error: ${error.message}`);
      Alert.alert("Error", `No se pudo procesar la imagen: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const compressImageForOCR = async (imageUri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const fileSizeKB = fileInfo.size / 1024;

      setDebugInfo(`📊 Tamaño original: ${fileSizeKB.toFixed(0)} KB`);

      // Configuración más agresiva de compresión desde el inicio
      let manipulationOptions = {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
        resize: { width: 1000 }, // Reducir tamaño por defecto
      };

      // Si es muy grande, comprimir aún más
      if (fileSizeKB > 500) {
        manipulationOptions = {
          compress: 0.4,
          format: ImageManipulator.SaveFormat.JPEG,
          resize: { width: 800 },
        };
      }

      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        manipulationOptions
      );

      const compressedInfo = await FileSystem.getInfoAsync(
        manipulatedImage.uri
      );
      const compressedSizeKB = compressedInfo.size / 1024;

      setDebugInfo(`📊 Tamaño comprimido: ${compressedSizeKB.toFixed(0)} KB`);

      // Si aún es muy grande, comprimir más
      if (compressedSizeKB > 500) {
        const superCompressed = await ImageManipulator.manipulateAsync(
          manipulatedImage.uri,
          [],
          {
            compress: 0.3,
            format: ImageManipulator.SaveFormat.JPEG,
            resize: { width: 600 },
          }
        );

        const finalInfo = await FileSystem.getInfoAsync(superCompressed.uri);
        const finalSizeKB = finalInfo.size / 1024;
        setDebugInfo(`📊 Tamaño final: ${finalSizeKB.toFixed(0)} KB`);

        return superCompressed.uri;
      }

      return manipulatedImage.uri;
    } catch (error) {
      console.error("Error al comprimir imagen:", error);
      setDebugInfo(`❌ Error compresión: ${error.message}`);
      throw error; // Re-lanzar el error para que sea manejado arriba
    }
  };

  const parseCosteñaProduct = (text) => {
    try {
      const product = {
        marca: "La Costeña",
        fecha: null,
        expiracion: null,
        descripcion: null,
        codigo: null,
        codigoBarras: null,
        lote: null,
        hora: null,
        planta: null,
        orden: null,
        cantidad: null,
      };

      const cleanText = text.replace(/\s+/g, " ").trim();
      console.log("Texto limpio para parsear:", cleanText);

      // Buscar FECHA (formato actualizado)
      const fechaRegex = /FECHA:\s*(\d{1,2}\.\d{1,2}\.\d{4})/i;
      const fechaMatch = cleanText.match(fechaRegex);
      if (fechaMatch) {
        product.fecha = fechaMatch[1];
        console.log("Fecha encontrada:", product.fecha);
      }

      // Buscar EXPIRA (formato actualizado)
      const expiraRegex = /EXPIRA:\s*(\d{1,2}\.\d{1,2}\.\d{4})/i;
      const expiraMatch = cleanText.match(expiraRegex);
      if (expiraMatch) {
        product.expiracion = expiraMatch[1];
        console.log("Expiración encontrada:", product.expiracion);
      }

      // Buscar HORA
      const horaRegex = /HORA:\s*(\d{1,2}:\d{2}:\d{2})/i;
      const horaMatch = cleanText.match(horaRegex);
      if (horaMatch) {
        product.hora = horaMatch[1];
        console.log("Hora encontrada:", product.hora);
      }

      // Buscar codigo de producto
      const condidoProductoRegex = /\b(\d{5,7})\b/;
      const codigoProductoMatch = cleanText.match(condidoProductoRegex);
      if (codigoProductoMatch) {
        product.codigo = codigoProductoMatch[1];
        console.log("Codigo producto:", product.codigo);
      }

      //Buscador cantidad por caja
      const cantidadRegex = /\b(\d{1,6})\s*CA\b/;
      const cantidadMatch = cleanText.match(cantidadRegex);
      if (cantidadMatch) {
        product.cantidad = cantidadMatch[1];
        console.log("Cantidad: ", product.cantidad);
      }

      // Buscar código de barras (patrón más flexible)
      const codigoRegex = /\b(500\d{9})\b/;
      const codigoMatch = cleanText.match(codigoRegex);
      if (codigoMatch) {
        product.codigoBarras = codigoMatch[1];
        console.log("Código de barras encontrado:", product.codigoBarras);
      }

      // Buscar descripción
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
          console.log("Descripción encontrada:", product.descripcion);
          break;
        }
      }

      // Buscar lote
      const loteRegex = /(?:LOTE|CONS):\s*([A-Z0-9]+)/i;
      const loteMatch = cleanText.match(loteRegex);
      if (loteMatch) {
        product.lote = loteMatch[1];
        console.log("Lote encontrado:", product.lote);
      }

      // Buscar planta
      const plantaRegex = /PLANTA\/ALMACEN\s*([A-Z\/]+)/i;
      const plantaMatch = cleanText.match(plantaRegex);
      if (plantaMatch) {
        product.planta = plantaMatch[1];
        console.log("Planta encontrada:", product.planta);
      }

      // Buscar orden
      const ordenRegex = /ORDEN\s*(\d+)/i;
      const ordenMatch = cleanText.match(ordenRegex);
      if (ordenMatch) {
        product.orden = ordenMatch[1];
        console.log("Orden encontrada:", product.orden);
      }

      // Verificar si se encontraron datos mínimos
      const hasMinimumData =
        product.fecha ||
        product.expiracion ||
        product.codigo ||
        product.codigoBarras ||
        product.codigo ||
        product.codigo ||
        product.descripcion;

      console.log("Producto parseado:", product);
      console.log("Tiene datos mínimos:", hasMinimumData);

      if (hasMinimumData) {
        Alert.alert(
          "Producto detectado",
          `
          Codigo: ${product.codigo || "N/A"} 
Fecha: ${product.fecha || "N/A"}
Expiración: ${product.expiracion || "N/A"}
Producto: ${product.descripcion || "N/A"}
Código de barras: ${product.codigoBarras || "N/A"}
Cantidad: ${product.cantidad || "N/A"}
        `.trim()
        );
      }

      return hasMinimumData ? product : null;
    } catch (error) {
      console.error("Error al parsear producto:", error);
      return null;
    }
  };

  const formatProductInfo = (product) => {
    if (!product) return "No se pudo extraer información del producto";

    let info = `🏷️ PRODUCTO LA COSTEÑA\n\n`;
    if (product.descripcion) info += `📦 Descripción: ${product.descripcion}\n`;
    if (product.codigoBarras)
      info += `📊 Código de Barras: ${product.codigoBarras}\n`;
    if (product.fecha) info += `📅 Fecha: ${product.fecha}\n`;
    if (product.expiracion) info += `⏰ Expira: ${product.expiracion}\n`;
    if (product.hora) info += `🕐 Hora: ${product.hora}\n`;
    if (product.lote) info += `🏭 Lote: ${product.lote}\n`;
    if (product.planta) info += `🏢 Planta: ${product.planta}\n`;
    if (product.orden) info += `📋 Orden: ${product.orden}\n`;
    if (product.cantidad) info += ` Cantidad: ${product.cantidad}\n`;

    return info;
  };

  const processOCRWithOCRSpace = async (imageUri) => {
    try {
      setDebugInfo("🔍 Procesando con OCR.space...");

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const base64Data = `data:image/jpeg;base64,${base64}`;
      const base64SizeKB = (base64.length * 0.75) / 1024;
      setDebugInfo(`📊 Tamaño base64: ${base64SizeKB.toFixed(0)} KB`);

      if (base64SizeKB > 1000) {
        throw new Error("Imagen muy grande para procesar (>1MB)");
      }

      const formData = new FormData();
      formData.append("base64Image", base64Data);
      formData.append("language", "spa");
      formData.append("isOverlayRequired", "false");
      formData.append("detectOrientation", "true");
      formData.append("scale", "true");
      formData.append("OCREngine", "2");

      setDebugInfo("🌐 Enviando solicitud a OCR.space...");

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: "K84583473088957",
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Error HTTP: ${response.status} - ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Respuesta OCR.space:", result);

      if (result.IsErroredOnProcessing) {
        throw new Error(result.ErrorMessage || "Error desconocido en OCR");
      }

      if (result.ParsedResults && result.ParsedResults.length > 0) {
        const parsedResult = result.ParsedResults[0];

        if (
          parsedResult.FileParseExitCode === 1 ||
          parsedResult.FileParseExitCode === 2
        ) {
          const extractedText = parsedResult.ParsedText;

          if (extractedText && extractedText.trim().length > 0) {
            setTextOCR(extractedText.trim());
            const productData = parseCosteñaProduct(extractedText.trim());
            setParsedProduct(productData);
            setDebugInfo(
              productData
                ? `✅ Producto parseado: ${
                    productData.descripcion || "Sin descripción"
                  }`
                : `✅ Texto extraído: ${extractedText.trim().length} caracteres`
            );
          } else {
            setTextOCR("No se detectó texto en la imagen");
            setDebugInfo("❌ No se detectó texto en la imagen");
          }
        } else {
          throw new Error(
            parsedResult.ErrorMessage ||
              `Error de parseo: código ${parsedResult.FileParseExitCode}`
          );
        }
      } else {
        setTextOCR("No se encontraron resultados");
        setDebugInfo("❌ No se encontraron resultados en la respuesta");
      }
    } catch (error) {
      console.error("Error en OCR.space:", error);
      setDebugInfo(`❌ Error OCR: ${error.message}`);
      setTextOCR(`Error al procesar OCR: ${error.message}`);
      throw error; // Re-lanzar para que sea manejado por el timeout
    }
  };

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Se necesita permiso para usar la cámara</Text>
        <Button title="Conceder permiso" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView style={{ flex: 2 }} facing="back" ref={cameraRef} />
      <View style={{ flex: 1, padding: 10 }}>
        <Button
          title={loading ? "Procesando OCR..." : "Tomar foto y extraer texto"}
          onPress={takePicture}
          disabled={loading}
        />
        {photo && (
          <Image
            source={{ uri: photo }}
            style={{
              width: 150,
              height: 150,
              alignSelf: "center",
              marginVertical: 10,
            }}
          />
        )}
        <Text style={{ fontSize: 12, color: "gray", marginVertical: 5 }}>
          {debugInfo}
        </Text>
        {loading && (
          <View
            style={{
              padding: 10,
              backgroundColor: "#f0f0f0",
              borderRadius: 5,
              marginVertical: 5,
            }}
          >
            <Text style={{ textAlign: "center", color: "#666" }}>
              Procesando texto...
            </Text>
          </View>
        )}
        {parsedProduct && (
          <View
            style={{
              backgroundColor: "#e8f5e8",
              padding: 15,
              borderRadius: 8,
              marginVertical: 10,
              borderLeftWidth: 4,
              borderLeftColor: "#4CAF50",
            }}
          >
            <Text
              style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10 }}
            >
              📦 PRODUCTO IDENTIFICADO
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 20 }}>
              {formatProductInfo(parsedProduct)}
            </Text>
          </View>
        )}
        <ScrollView style={{ flex: 1, marginTop: 10 }}>
          <Text style={{ fontSize: 16, lineHeight: 24 }}>
            {textOCR || "Presiona el botón para extraer texto de una imagen"}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}
