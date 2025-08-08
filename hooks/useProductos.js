import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabase";

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
            ),
            piso (
              id,
              cantidad
            ),
            suelto (
              id,
              cantidad
            )
          `
        )

        .order("nombre", { ascending: true });

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
            ),
            piso (
              id,
              cantidad
            ),
              suelto (
              id,
              cantidad
            )
    `
        )
        .order("nombre", { ascending: true });

      const numericValue = parseInt(searchTerm);
      const isValidNumber =
        !isNaN(numericValue) && numericValue.toString() === searchTerm.trim();

      if (isValidNumber) {
        query = query.or(
          `codigo.eq.${numericValue},nombre.ilike.${searchTerm}%`
        );
      } else {
        const searchPattern = searchTerm
          .split(" ")
          .map((word) => `%${word}%`)
          .join("");

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

  const agregarProducto = async (datosProducto) => {
    try {
      setError(null);

      const { data: existingProduct, error: checkError } = await supabase
        .from("productos")
        .select("id, codigo")
        .eq("codigo", datosProducto.codigo)
        .eq("marca_id", datosProducto.marca_id)

        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingProduct) {
        throw new Error("Ya existe un producto con ese código");
      }

      const { data: existingName, error: nameError } = await supabase
        .from("productos")
        .select("id, nombre")
        .eq("nombre", datosProducto.nombre)
        .eq("marca_id", datosProducto.marca_id)
        .single();

      if (nameError && nameError.code !== "PGRST116") {
        throw nameError;
      }

      if (existingName) {
        throw new Error("Ya existe un producto con ese nombre en esta marca");
      }

      const { data, error } = await supabase
        .from("productos")
        .insert([datosProducto])
        .select()
        .single();

      if (error) {
        throw error;
      }

      await fetchProductos();

      return data;
    } catch (error) {
      console.error("Error agregando producto:", error);
      setError(error.message);
      throw error;
    }
  };
  const procesarEntradaCompleta = async (
    productoId,
    cantidadAgregar,
    codigoBarras = null,
    rackId = null,
    fechaCaducidad = null,
    tipoUbicacion = "rack"
  ) => {
    try {
      const codigoLimpio = codigoBarras
        ? codigoBarras.trim().replace(/\D/g, "")
        : null;

      if (codigoLimpio && codigoLimpio.length >= 5) {
        const producto = productos.find((p) => p.id === productoId);
        if (!producto) {
          throw new Error("Producto no encontrado");
        }
        const marcaId = producto.marca_id;

        const tablaVerificar = tipoUbicacion === "suelto" ? "suelto" : "cajas";

        const { data, error: queryError } = await supabase
          .from(tablaVerificar)
          .select(
            `
          *,
          productos!inner (
            id,
            marca_id
          )
        `
          )
          .eq("codigo_barras", codigoLimpio)
          .eq("productos.marca_id", marcaId);

        if (queryError) {
          throw queryError;
        }

        if (data && data.length > 0) {
          throw new Error(
            "Este código de barras ya fue registrado anteriormente en esta marca"
          );
        }

        const tablaOpuesta = tipoUbicacion === "suelto" ? "cajas" : "suelto";
        const { data: dataOpuesta, error: queryErrorOpuesta } = await supabase
          .from(tablaOpuesta)
          .select(
            `
          *,
          productos!inner (
            id,
            marca_id
          )
        `
          )
          .eq("codigo_barras", codigoLimpio)
          .eq("productos.marca_id", marcaId);

        if (queryErrorOpuesta) {
          throw queryErrorOpuesta;
        }

        if (dataOpuesta && dataOpuesta.length > 0) {
          throw new Error(
            `Este código de barras ya fue registrado en ${tablaOpuesta} para esta marca`
          );
        }
      }

      const producto = productos.find((p) => p.id === productoId);
      const cantidadAnterior = producto.cantidad || 0;
      const cajasAnteriores = producto.cajas || 0;

      const cantidadNueva = cantidadAnterior + cantidadAgregar;
      const cajasNuevas = cajasAnteriores + 1;

      const tablaDestino = tipoUbicacion === "suelto" ? "suelto" : "cajas";

      const fechaCaducidadFinal =
        fechaCaducidad || obtenerFechaCaducidadDesdeCodigo(codigoBarras);
      const datosInsertar = {
        producto_id: productoId,
        cantidad: cantidadAgregar,
        fecha_caducidad: fechaCaducidadFinal,
        codigo_barras: codigoLimpio,
      };

      if (tipoUbicacion !== "suelto") {
        datosInsertar.rack_id = rackId;
      }

      const { error: insertError } = await supabase
        .from(tablaDestino)
        .insert(datosInsertar);

      if (insertError) throw insertError;

      return {
        cantidadAnterior,
        cantidadNueva,
        cajasAnteriores,
        cajasNuevas,
        tablaUsada: tablaDestino,
      };
    } catch (error) {
      console.error("Error procesando entrada completa:", error);
      throw error;
    }
  };

  async function procesarSalidaCompleta(
    productoId,
    cantidadNecesaria,
    codigoBarras = null,
    detalleId = null
  ) {
    let query = supabase
      .from("piso")
      .select("*")
      .eq("producto_id", productoId)
      .gt("cantidad", 0)
      .order("fecha_caducidad", { ascending: true });

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

    let cantidadRestante = cantidadNecesaria;
    let cantidadTotalRestada = 0;

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
      const aRestar = Math.min(cantidadDisponible, cantidadRestante);

      await supabase
        .from("piso")
        .update({ cantidad: cantidadDisponible - aRestar })
        .eq("id", lote.id);

      cantidadRestante -= aRestar;
      cantidadTotalRestada += aRestar;

      if (aRestar === cantidadDisponible) {
        nuevasCajas -= 1;
      }

      nuevaCantidad -= aRestar;
    }

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

  const obtenerFechaCaducidadDesdeCodigo = (codigoBarras) => {
    if (!codigoBarras || codigoBarras.length < 18) return null;

    const yy = codigoBarras.substring(12, 14);
    const mm = codigoBarras.substring(14, 16);
    const dd = codigoBarras.substring(16, 18);

    const anio = parseInt("20" + yy);
    const mes = parseInt(mm) - 1;
    const dia = parseInt(dd);

    return new Date(anio, mes, dia);
  };

  const verificarCodigoBarrasUnico = async (codigoBarras) => {
    try {
      if (!codigoBarras || codigoBarras.trim().length === 0) {
        return true;
      }

      const codigoLimpio = codigoBarras.trim().replace(/\D/g, "");

      if (codigoLimpio.length < 5) {
        return true;
      }

      const marcaFiltro = marcaId || marcaId;

      let query = supabase
        .from("cajas")
        .select(
          `
        *,
        productos!inner (
          id,
          marca_id
        )
      `,
          { count: "exact", head: true }
        )
        .eq("codigo_barras", codigoLimpio);

      if (marcaFiltro) {
        query = query.eq("productos.marca_id", marcaFiltro);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error en consulta:", error);
        return true;
      }

      return count === 0;
    } catch (error) {
      console.error("Error verificando código de barras:", error);
      return true;
    }
  };

  const agregarPendiente = async (
    productoId,
    cantidad,
    codigoBarras = null,
    ubicacion,
    fechaCaducidad = null
  ) => {
    try {
      const { data, error } = await supabase
        .from("pendientes")
        .insert([
          {
            producto_id: productoId,
            cantidad: cantidad,
            codigo_barras: codigoBarras,
            ubicacion: ubicacion,
            fecha_caducidad: fechaCaducidad,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error agregando pendiente:", error);
      throw error;
    }
  };

  const obtenerPendientes = async () => {
    try {
      const { data, error } = await supabase
        .from("pendientes")
        .select(
          `
        *,
        productos (
          id,
          nombre,
          codigo,
          marcas (
            id,
            nombre,
            logo
          )
        )
      `
        )
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error obteniendo pendientes:", error);
      throw error;
    }
  };

  const confirmarPendiente = async (pendienteId) => {
    try {
      const { data: pendiente, error: pendienteError } = await supabase
        .from("pendientes")
        .select("*")
        .eq("id", pendienteId)
        .single();

      if (pendienteError) throw pendienteError;

      const esSuelto = pendiente.ubicacion === "SUELTO";
      const tablaDestino = esSuelto ? "suelto" : "cajas";

      const datosInsertar = {
        producto_id: pendiente.producto_id,
        cantidad: pendiente.cantidad,
        fecha_caducidad: pendiente.fecha_caducidad,
        codigo_barras: pendiente.codigo_barras,
      };

      if (!esSuelto) {
        const { data: rack, error: rackError } = await supabase
          .from("racks")
          .select("id")
          .eq("codigo_rack", pendiente.ubicacion)
          .single();

        if (rackError) throw rackError;
        if (!rack)
          throw new Error(`No se encontró el rack ${pendiente.ubicacion}`);

        datosInsertar.rack_id = rack.id;
      }

      const { error: insertError } = await supabase
        .from(tablaDestino)
        .insert(datosInsertar);

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from("pendientes")
        .delete()
        .eq("id", pendienteId);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (error) {
      console.error("Error confirmando pendiente:", error);
      throw error;
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
    agregarProducto,
    procesarEntradaCompleta,
    procesarSalidaCompleta,
    obtenerFechaCaducidadDesdeCodigo,
    verificarCodigoBarrasUnico,
    agregarPendiente,
    obtenerPendientes,
    confirmarPendiente,
  };
};
