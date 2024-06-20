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
  center: [0, 53.23365],
  zoom: 13,
});

map.on("load", () => {
  map.addSource("portland", {
    type: "raster",
    url: "mapbox://examples.32xkp0wd",
  });

  new EllipsisVectorLayer({
    pathId: "55f102b7-e660-4045-8f99-35dbba2a53fb",
    maxFeaturesPerTile: 30,
    pageSize: 1000,
    maxFeaturesPerTile: 100000,
    filter: [],
  }).addTo(map);
});
