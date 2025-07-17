import React, { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";
import HistorialEntradaTemplate from "../components/templates/HistorialEntradaTemplate";

const HistorialEntradasScreen = ({ route }) => {
  const { producto } = route.params;
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarHistorial = async () => {
      const { data, error } = await supabase
        .from("cajas")
        .select(
          `
          id, cantidad, fecha_caducidad, rack_id,
          racks (codigo_rack)
        `
        )
        .eq("producto_id", producto.id)
        .order("fecha_caducidad", { ascending: true });

      if (!error) setHistorial(data);
      setLoading(false);
    };

    cargarHistorial();
  }, []);

  return (
    <HistorialEntradaTemplate
      historial={historial}
      loading={loading}
      producto={producto}
    />
  );
};

export default HistorialEntradasScreen;
