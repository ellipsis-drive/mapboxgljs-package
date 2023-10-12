import {
  EllipsisVectorLayer,
  EllipsisRasterLayer,
  AsyncEllipsisRasterLayer,
} from "../lib";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZGFhbjE5OTEiLCJhIjoiY2tjb3h5OHFpMHB3YTMzcGJ3d2hrajVwZSJ9.BSZbQtdYXaM1YA6hVDP_yg";
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

  const plots = new EllipsisVectorLayer({
    pathId: "09f5e90d-f011-437c-b789-3cedfbca80bb",
    onFeatureClick: (f) => {
      console.log("clicked", f);
    },
  }).addTo(map);
});
