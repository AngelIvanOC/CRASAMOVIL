import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabase"; // Ajusta la ruta según tu estructura

export const useProductos = (marcaId = null) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductos = async (filtroMarcaId = marcaId) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("productos")
        .select(
          `
            *,
            marcas (
              id,
              nombre,
              logo
            ),
            cajas (
              id,
              cantidad,
              rack_id,
              racks (
                id,
                codigo_rack
              )
            )
          `
        )

        .order("nombre", { ascending: true });

      // Si se especifica una marca, filtrar por ella
      if (filtroMarcaId) {
        query = query.eq("marca_id", filtroMarcaId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setProductos(data || []);
    } catch (error) {
      console.error("Error fetching productos:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const searchProductos = async (searchTerm, filtroMarcaId = marcaId) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("productos")
        .select(
          `
      *,
            marcas (
              id,
              nombre,
              logo
            ),
            cajas (
              id,
              cantidad,
              rack_id,
              racks (
                id,
                codigo_rack
              )
            )
    `
        )
        .order("nombre", { ascending: true });

      // Verificar si es un número entero válido
      const numericValue = parseInt(searchTerm);
      const isValidNumber =
        !isNaN(numericValue) && numericValue.toString() === searchTerm.trim();

      if (isValidNumber) {
        // Para números: buscar por código exacto o que el nombre empiece con ese número
        query = query.or(
          `codigo.eq.${numericValue},nombre.ilike.${searchTerm}%`
        );
      } else {
        // Para texto: buscar palabras que empiecen con el término buscado
        const searchPattern = searchTerm
          .split(" ")
          .map((word) => `%${word}%`)
          .join("");

        // Buscar que el nombre empiece con el término O que contenga palabras que empiecen con el término
        query = query.or(
          `nombre.ilike.${searchTerm}%,nombre.ilike.% ${searchTerm}%`
        );
      }

      if (filtroMarcaId) {
        query = query.eq("marca_id", filtroMarcaId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setProductos(data || []);
    } catch (error) {
      console.error("Error searching productos:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para actualizar la cantidad de un producto

  // Función completa para procesar una entrada
  const procesarEntradaCompleta = async (
    productoId,
    cantidadAgregar,
    codigoBarras = null,
    rackId = null,
    fechaCaducidad = null
  ) => {
    try {
      const codigoLimpio = codigoBarras
        ? codigoBarras.trim().replace(/\D/g, "")
        : null;

      if (codigoLimpio && codigoLimpio.length >= 5) {
        // Solo verificar si tiene longitud mínima
        const { data, count } = await supabase
          .from("cajas")
          .select("*", { count: "exact", head: true })
          .eq("codigo_barras", codigoLimpio);

        if (count > 0) {
          throw new Error(
            "Este código de barras ya fue registrado anteriormente"
          );
        }
      }

      const producto = productos.find((p) => p.id === productoId);
      const cantidadAnterior = producto.cantidad || 0;
      const cajasAnteriores = producto.cajas || 0;

      const cantidadNueva = cantidadAnterior + cantidadAgregar;
      const cajasNuevas = cajasAnteriores + 1; // porque cada escaneo es 1 caja

      // 2. Insertar nueva entrada en cajas
      const fechaCaducidadFinal =
        fechaCaducidad || obtenerFechaCaducidadDesdeCodigo(codigoBarras);
      const { error: insertError } = await supabase.from("cajas").insert({
        producto_id: productoId,
        cantidad: cantidadAgregar,
        fecha_caducidad: fechaCaducidadFinal,
        rack_id: rackId,
        codigo_barras: codigoLimpio, // ✅ Guardar el código escaneado
      });

      if (insertError) throw insertError;

      // 3. ✅ Marcar el rack como ocupado (solo si hay rack)

      return {
        cantidadAnterior,
        cantidadNueva,
        cajasAnteriores,
        cajasNuevas,
      };
    } catch (error) {
      console.error("Error procesando entrada completa:", error);
      throw error;
    }
  };

  // Agregar después de la función procesarEntradaCompleta
  async function procesarSalidaCompleta(
    productoId,
    cantidadNecesaria, // Cantidad que aún se necesita completar
    codigoBarras = null,
    detalleId = null
  ) {
    let query = supabase
      .from("cajas")
      .select("*")
      .eq("producto_id", productoId)
      .gt("cantidad", 0)
      .order("fecha_entrada", { ascending: true });

    if (codigoBarras) {
      query = query.eq("codigo_barras", codigoBarras.trim());
    }

    const { data: lotes, error } = await query;

    if (error) throw error;

    if (!lotes || lotes.length === 0) {
      if (codigoBarras) {
        throw new Error("No hay lotes disponibles con ese código de barras.");
      }
      throw new Error("No hay lotes disponibles para este producto.");
    }

    // ✅ CAMBIO: Procesar toda la cantidad disponible del código escaneado,
    // pero limitada a la cantidad que aún se necesita
    let cantidadRestante = cantidadNecesaria;
    let cantidadTotalRestada = 0;

    // 1. Obtener producto actual
    const { data: productoData, error: productoError } = await supabase
      .from("productos")
      .select("id, cantidad, cajas")
      .eq("id", productoId)
      .single();

    if (productoError) throw productoError;

    let nuevasCajas = productoData.cajas;
    let nuevaCantidad = productoData.cantidad;

    for (const lote of lotes) {
      if (cantidadRestante <= 0) break;

      const cantidadDisponible = lote.cantidad;
      // ✅ Tomar toda la cantidad disponible del lote, pero limitada a lo que se necesita
      const aRestar = Math.min(cantidadDisponible, cantidadRestante);

      await supabase
        .from("cajas")
        .update({ cantidad: cantidadDisponible - aRestar })
        .eq("id", lote.id);

      cantidadRestante -= aRestar;
      cantidadTotalRestada += aRestar;

      // Si el lote se vacía, restar una caja
      if (aRestar === cantidadDisponible) {
        nuevasCajas -= 1;
      }

      // Siempre restar de la cantidad total
      nuevaCantidad -= aRestar;
    }

    // 3. Actualizar producto con la nueva cantidad y cajas
    /*await supabase
      .from("productos")
      .update({
        cantidad: nuevaCantidad,
        cajas: nuevasCajas,
      })
      .eq("id", productoId);
*/
    // ✅ ACTUALIZAR escaneado en detalle_ventas si se proporcionó detalleId
    if (detalleId) {
      const { data: detalleActual, error: detalleError } = await supabase
        .from("detalle_ventas")
        .select("escaneado")
        .eq("id", detalleId)
        .single();

      if (detalleError) throw detalleError;

      const escaneadoPrevio = detalleActual?.escaneado || 0;
      const nuevoEscaneado = escaneadoPrevio + cantidadTotalRestada;

      const { error: updateError } = await supabase
        .from("detalle_ventas")
        .update({ escaneado: nuevoEscaneado })
        .eq("id", detalleId);

      if (updateError) throw updateError;
    }

    return {
      cantidadRestada: cantidadTotalRestada,
      cantidadFaltante: cantidadNecesaria - cantidadTotalRestada,
    };
  }

  // Funcion para obtener la fecha desde el codigo de barras
  const obtenerFechaCaducidadDesdeCodigo = (codigoBarras) => {
    if (!codigoBarras || codigoBarras.length < 18) return null;

    const yy = codigoBarras.substring(12, 14);
    const mm = codigoBarras.substring(14, 16);
    const dd = codigoBarras.substring(16, 18);

    const anio = parseInt("20" + yy);
    const mes = parseInt(mm) - 1; // Mes en JS es 0-indexed
    const dia = parseInt(dd);

    return new Date(anio, mes, dia);
  };

  // En useProductos.js
  const verificarCodigoBarrasUnico = async (codigoBarras) => {
    try {
      if (!codigoBarras || codigoBarras.trim().length === 0) {
        return true; // Permitir si no hay código
      }

      // Limpiar el código de barras (eliminar espacios, caracteres especiales)
      const codigoLimpio = codigoBarras.trim().replace(/\D/g, "");

      // Verificar longitud mínima (ajusta según tus necesidades)
      if (codigoLimpio.length < 5) {
        return true; // Códigos muy cortos no se verifican
      }

      const { data, error, count } = await supabase
        .from("cajas")
        .select("*", { count: "exact", head: true })
        .eq("codigo_barras", codigoLimpio);

      if (error) {
        console.error("Error en consulta:", error);
        return true; // En caso de error, permitir continuar
      }

      return count === 0;
    } catch (error) {
      console.error("Error verificando código de barras:", error);
      return true; // En caso de excepción, permitir continuar
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [marcaId]);

  return {
    productos,
    loading,
    error,
    fetchProductos,
    searchProductos,
    procesarEntradaCompleta,
    procesarSalidaCompleta,
    obtenerFechaCaducidadDesdeCodigo,
    verificarCodigoBarrasUnico,
  };
};
