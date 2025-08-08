import React, { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";
import PisoTemplate from "../components/templates/PisoTemplate";

const PisoScreen = ({ route, navigation }) => {
  const { producto } = route.params;
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const handleBajarCaja = () => {
    navigation.navigate("BajarPiso", {
      producto,
      onUpdate: cargarHistorial,
    });
  };

  const cargarHistorial = async () => {
    const { data, error } = await supabase
      .from("piso")
      .select(
        `
          id, cantidad, fecha_caducidad, codigo_barras
        `
      )
      .eq("producto_id", producto.id)
      .order("fecha_caducidad", { ascending: true });

    if (!error) setHistorial(data);
    setLoading(false);
  };

  const getSugerenciaRack = async (productoId) => {
    try {
      const [cajasResult, sueltoResult] = await Promise.all([
        supabase
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
          .order("fecha_caducidad", { ascending: true }),

        supabase
          .from("suelto")
          .select("*")
          .eq("producto_id", productoId)
          .gt("cantidad", 0)
          .order("fecha_caducidad", { ascending: true }),
      ]);

      if (cajasResult.error) throw cajasResult.error;
      if (sueltoResult.error) throw sueltoResult.error;

      const cajas = cajasResult.data || [];
      const suelto = sueltoResult.data || [];

      const todoInventario = [
        ...cajas.map((item) => ({ ...item, origen: "rack" })),
        ...suelto.map((item) => ({ ...item, origen: "suelto" })),
      ];

      todoInventario.sort(
        (a, b) => new Date(a.fecha_caducidad) - new Date(b.fecha_caducidad)
      );

      return todoInventario.length > 0 ? todoInventario[0] : null;
    } catch (error) {
      console.error("Error obteniendo sugerencia de rack:", error);
      return null;
    }
  };

  return (
    <PisoTemplate
      historial={historial}
      loading={loading}
      producto={producto}
      navigation={navigation}
      onBajarCaja={handleBajarCaja}
      getSugerenciaRack={getSugerenciaRack}
    />
  );
};

export default PisoScreen;
