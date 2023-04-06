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

const createEllipsisRasterLayer = async () => {
  return;
  const someRaster = await AsyncEllipsisRasterLayer({
    pathId: "28fb0f5f-e367-4265-b84b-1b8f1a8a6409",
  });
  someRaster.addTo(map);
};

createEllipsisRasterLayer();

map.on("load", () => {
  map.addSource("portland", {
    type: "raster",
    url: "mapbox://examples.32xkp0wd",
  });

  const plots = new EllipsisVectorLayer({
    pathId: "2109c37a-d549-45dd-858e-7eddf1bd7c22",
    pageSize: 1000,
    maxFeaturesPerTile: 10000,
    maxMbPerTile: 1000000,
    maxZoom: 21,
  }).addTo(map);
});
