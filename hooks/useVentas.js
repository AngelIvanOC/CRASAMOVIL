import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabase";
import { useUsuarios } from "./useUsuarios";

export const useVentas = (marcaId = null) => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { usuarioActual } = useUsuarios();

  const fetchVentas = async (marcaId = null) => {
    try {
      if (!usuarioActual?.id_auth) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      let query;

      if (usuarioActual.roles?.id === 5) {
        const { data: ayudanteVentas, error: ayudanteError } = await supabase
          .from("ayudantes_venta")
          .select("venta_id")
          .eq("usuario_id", usuarioActual.id_auth);

        if (ayudanteError) throw ayudanteError;

        const ventaIds = ayudanteVentas.map((v) => v.venta_id);

        if (ventaIds.length === 0) {
          setVentas([]);
          setLoading(false);
          return;
        }

        query = supabase
          .from("ventas")
          .select(
            `
          *,
          marcas (id, nombre),
          usuarios (id, correo)
        `
          )
          .in("id", ventaIds)
          .order("fecha", { ascending: false });
      } else {
        query = supabase
          .from("ventas")
          .select(
            `
          *,
          marcas (id, nombre),
          usuarios (id, correo)
        `
          )
          .eq("usuario", usuarioActual.id_auth)
          .order("fecha", { ascending: false });
      }

      if (marcaId) {
        query = query.eq("marca_id", marcaId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setVentas(data || []);
    } catch (err) {
      console.error("Error fetching ventas:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchVentas = async (searchTerm, marcaId = null) => {
    try {
      setLoading(true);
      setError(null);

      let query;

      if (usuarioActual.roles?.id === 5) {
        const { data: ayudanteVentas, error: ayudanteError } = await supabase
          .from("ayudantes_venta")
          .select("venta_id")
          .eq("usuario_id", usuarioActual.id_auth);

        if (ayudanteError) throw ayudanteError;

        const ventaIds = ayudanteVentas.map((v) => v.venta_id);

        if (ventaIds.length === 0) {
          setVentas([]);
          setLoading(false);
          return;
        }

        query = supabase
          .from("ventas")
          .select(
            `
          *,
          marcas (id, nombre),
          usuarios (id, correo)
        `
          )
          .in("id", ventaIds)
          .order("fecha", { ascending: false });
      } else {
        query = supabase
          .from("ventas")
          .select(
            `
          *,
          marcas (id, nombre),
          usuarios (id, correo)
        `
          )
          .eq("usuario", usuarioActual.id_auth)
          .order("fecha", { ascending: false });
      }

      if (marcaId) {
        query = query.eq("marca_id", marcaId);
      }

      if (searchTerm) {
        query = query.or(`codigo.ilike.%${searchTerm}%,id.eq.${searchTerm}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setVentas(data || []);
    } catch (err) {
      console.error("Error searching ventas:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getVentasByDateRange = async (startDate, endDate, marcaId = null) => {
    try {
      setLoading(true);
      setError(null);

      let query;

      if (usuarioActual.roles?.id === 5) {
        const { data: ayudanteVentas, error: ayudanteError } = await supabase
          .from("ayudantes_venta")
          .select("venta_id")
          .eq("usuario_id", usuarioActual.id_auth);

        if (ayudanteError) throw ayudanteError;

        const ventaIds = ayudanteVentas.map((v) => v.venta_id);

        if (ventaIds.length === 0) {
          setVentas([]);
          setLoading(false);
          return;
        }

        query = supabase
          .from("ventas")
          .select(
            `
          *,
          marcas (id, nombre),
          usuarios (id, correo)
        `
          )
          .in("id", ventaIds)
          .gte("fecha", startDate)
          .lte("fecha", endDate)
          .order("fecha", { ascending: false });
      } else {
        query = supabase
          .from("ventas")
          .select(
            `
          *,
          marcas (id, nombre),
          usuarios (id, correo)
        `
          )
          .eq("usuario", usuarioActual.id_auth)
          .gte("fecha", startDate)
          .lte("fecha", endDate)
          .order("fecha", { ascending: false });
      }

      if (marcaId) {
        query = query.eq("marca_id", marcaId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setVentas(data || []);
    } catch (err) {
      console.error("Error fetching ventas by date range:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const assignVentaToUser = async (ventaId, userAuthId) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("id_auth")
        .eq("id_auth", userAuthId)
        .single();

      if (userError) {
        console.error("Error finding user:", userError);
        throw new Error("Usuario no encontrado en la base de datos");
      }

      if (!userData) {
        throw new Error("Usuario no existe en la tabla usuarios");
      }

      const { error } = await supabase
        .from("ventas")
        .update({ usuario: userData.id_auth, estado: "en_progreso" })
        .eq("id", ventaId);

      if (error) throw error;

      await fetchVentas(marcaId);

      return true;
    } catch (err) {
      console.error("Error assigning venta to user:", err);
      throw err;
    }
  };

  const updateVentaEstado = async (ventaId) => {
    try {
      console.log("Actualizando estado de venta:", ventaId);

      const { data: detalles, error: detalleError } = await supabase
        .from("detalle_ventas")
        .select("estado")
        .eq("venta_id", ventaId);

      if (detalleError) throw detalleError;

      let nuevoEstado = "incompleto";

      if (detalles && detalles.length > 0) {
        const completados = detalles.filter(
          (d) => d.estado === "completado"
        ).length;
        const total = detalles.length;

        console.log(`Productos completados: ${completados}/${total}`);

        if (completados === total) {
          nuevoEstado = "completado";
        } else if (completados > 0) {
          nuevoEstado = "en_progreso";
        }
      }

      console.log("Nuevo estado calculado:", nuevoEstado);

      const { error: updateError } = await supabase
        .from("ventas")
        .update({ estado: nuevoEstado })
        .eq("id", ventaId);

      if (updateError) throw updateError;

      await fetchVentas(marcaId);

      return nuevoEstado;
    } catch (err) {
      console.error("Error updating venta estado:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (usuarioActual?.id_auth) {
      fetchVentas(marcaId);
    }
  }, [usuarioActual?.id_auth]); 

  return {
    ventas,
    loading,
    error,
    fetchVentas,
    searchVentas,
    getVentasByDateRange,
    updateVentaEstado,
    assignVentaToUser,
  };
};
