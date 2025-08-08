import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabase";
import { useVentas } from "./useVentas";

export const useDetalleVentas = (ventaId) => {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [venta, setVenta] = useState(null);

  const { updateVentaEstado } = useVentas();

  const fetchDetalleVentas = async (ventaId) => {
    try {
      setLoading(true);
      setError(null);

      const { data: ventaData, error: ventaError } = await supabase
        .from("ventas")
        .select(
          `
          *,
          marcas (
            id,
            nombre
          )
        `
        )
        .eq("id", ventaId)
        .single();

      if (ventaError) {
        throw ventaError;
      }

      setVenta(ventaData);

      const { data: detallesData, error: detallesError } = await supabase
        .from("detalle_ventas")
        .select(
          `
          *,
          productos (
            id,
            codigo,
            nombre,
            marca_id,
            cajas,
            cantidad,
            racks (
              id,
              codigo_rack
            )
          )
        `
        )
        .eq("venta_id", ventaId)
        .order("id", { ascending: true });

      if (detallesError) {
        throw detallesError;
      }

      setDetalles(detallesData || []);
    } catch (err) {
      console.error("Error fetching detalle ventas:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchDetalles = async (searchTerm) => {
    try {
      setLoading(true);
      setError(null);

      await fetchDetalleVentas(ventaId);

      if (!searchTerm.trim()) return;

      const term = searchTerm.toLowerCase();

      const filtrados = detalles.filter((d) => {
        const nombre = d.productos?.nombre
          ? String(d.productos.nombre).toLowerCase()
          : "";
        const codigo = d.productos?.codigo
          ? String(d.productos.codigo).toLowerCase()
          : "";

        return nombre.includes(term) || codigo === term;
      });

      setDetalles(filtrados);
    } catch (err) {
      console.error("Error searching detalle ventas:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateDetalle = async (detalleId, updates) => {
    try {
      const { data, error } = await supabase
        .from("detalle_ventas")
        .update(updates)
        .eq("id", detalleId)
        .select(
          `
          *,
          productos (
            id,
            codigo,
            nombre,
            marca_id,
            cajas,
            cantidad,
            racks (
              id,
              codigo_rack
            )
          )
        `
        )
        .single();

      if (error) {
        throw error;
      }

      setDetalles((prev) =>
        prev.map((detalle) => (detalle.id === detalleId ? data : detalle))
      );

      return data;
    } catch (err) {
      console.error("Error updating detalle:", err);
      throw err;
    }
  };

  const updateEstadoDetalle = async (detalleId, nuevoEstado) => {
    try {
      const { data, error } = await supabase
        .from("detalle_ventas")
        .update({ estado: nuevoEstado })
        .eq("id", detalleId)
        .select(
          `
          *,
          productos (
            id,
            codigo,
            nombre,
            marca_id,
            cajas,
            cantidad,
            racks (
              id,
              codigo_rack
            )
          )
        `
        )
        .single();

      if (error) {
        throw error;
      }

      setDetalles((prev) =>
        prev.map((detalle) => (detalle.id === detalleId ? data : detalle))
      );

      if (ventaId) {
        await updateVentaEstado(ventaId);
      }

      return data;
    } catch (err) {
      console.error("Error updating estado detalle:", err);
      throw err;
    }
  };

  const getSugerenciaPiso = async (productoId) => {
    try {
      const { data: cajasPiso, error } = await supabase
        .from("piso")
        .select("*")
        .eq("producto_id", productoId)
        .gt("cantidad", 0)
        .order("fecha_caducidad", { ascending: true })
        .limit(1);

      if (error) throw error;

      return cajasPiso && cajasPiso.length > 0 ? cajasPiso[0] : null;
    } catch (error) {
      console.error("Error obteniendo sugerencia de piso:", error);
      return null;
    }
  };

  const getSugerenciaRack = async (productoId) => {
    try {
      const { data: cajas, error } = await supabase
        .from("cajas")
        .select(
          `
        *,
        racks (
          id,
          codigo_rack
        )
      `
        )
        .eq("producto_id", productoId)
        .gt("cantidad", 0)
        .order("fecha_caducidad", { ascending: true })
        .limit(1);

      if (error) throw error;

      return cajas && cajas.length > 0 ? cajas[0] : null;
    } catch (error) {
      console.error("Error obteniendo sugerencia de rack:", error);
      return null;
    }
  };

  useEffect(() => {
    if (ventaId) {
      fetchDetalleVentas(ventaId);
    }
  }, [ventaId]);

  return {
    detalles,
    venta,
    loading,
    error,
    fetchDetalleVentas,
    searchDetalles,
    updateDetalle,
    updateEstadoDetalle,
    getSugerenciaRack,
    getSugerenciaPiso,
  };
};
