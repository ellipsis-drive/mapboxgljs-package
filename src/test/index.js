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
  center: [-117.30068, 56.23365],
  zoom: 13,
});

map.on("load", () => {
  map.addSource("portland", {
    type: "raster",
    url: "mapbox://examples.32xkp0wd",
  });

  new EllipsisVectorLayer({
    pathId: "974b3911-ef1c-42ca-a21f-ce804d592ba0",
    style: "38d46a9e-5ff9-4f94-8ace-fd40a53dbc23",
  }).addTo(map);
});
