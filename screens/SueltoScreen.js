import React, { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";
import SueltoTemplate from "../components/templates/SueltoTemplate";

const SueltoScreen = ({ route, navigation }) => {
  const { producto } = route.params;
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    const { data, error } = await supabase
      .from("suelto")
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

  const handleSubirSueltoItem = (sueltoItem, rackSugerido) => {
    navigation.navigate("SubirSuelto", {
      producto,
      sueltoItem,
      rackSugerido,
      onUpdate: cargarHistorial,
    });
  };

  return (
    <SueltoTemplate
      historial={historial}
      loading={loading}
      producto={producto}
      navigation={navigation}
      onSubirSueltoItem={handleSubirSueltoItem}
    />
  );
};

export default SueltoScreen;
