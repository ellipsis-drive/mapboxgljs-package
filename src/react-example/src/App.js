import "./App.css";
import React from "react";

const mapboxgl = window.mapboxgl;
const Ellipsis = window.Ellipsis;

function init() {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiZHV0Y2hqZWxseSIsImEiOiJja3Y0MXhsajc0ZHE3Mm5zNzhucTJiZXhmIn0.7UQPvzDakKqhRAUrUEQmxg";
  const map = new mapboxgl.Map({
    container: "map", // container ID
    style: "mapbox://styles/mapbox/streets-v11", // style URL
    center: [4.633205849096186, 52.373527706597514], // starting position [lng, lat]
    zoom: 16, // starting zoom
  });

  map.on("load", () => {
    map.addSource("portland", {
      type: "raster",
      url: "mapbox://examples.32xkp0wd",
    });

    map.addLayer({
      id: "portland",
      source: "portland",
      type: "raster",
    });

    // Ellipsis.RasterLayer(
    //     "01104b4f-85a7-482c-9ada-11dbce171982",
    //     0,
    //     "01f63a0d-3f92-42d3-925d-b3bfaf6dd6a1"
    // ).addTo(map);
    // Ellipsis.VectorLayer(
    //     '9649385a-70e5-455a-8013-eb3c052525f4',
    //     '564b79df-6839-4efd-a219-e08883e65f95'
    // ).addTo(map);

    Ellipsis.VectorLayer(
      "1a24a1ee-7f39-4d21-b149-88df5a3b633a",
      "45c47c8a-035e-429a-9ace-2dff1956e8d9",
      {
        onFeatureClick: (x) => console.log(x),
        loadAll: true,
      }
    ).addTo(map);

    Ellipsis.VectorLayer(
      "b8468235-31b5-4959-91a4-0e52a1d4feb6",
      "44be2542-d20d-457b-b003-698d048d2c6c",
      {
        // useMarkers: true,
        onFeatureClick: (x) => console.log(x),
        radius: 3,
        loadAll: false,
      }
    ).addTo(map);
  });
}

function App() {
  React.useEffect(() => {
    init();
  }, []);

  return (
    <div className="App">
      <h1>Test for Ellipsis Drive MapboxGL.js Package</h1>
      <div id="map"></div>
    </div>
  );
}

export default App;
