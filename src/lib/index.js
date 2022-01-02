import EllipsisVectorLayer from "./EllipsisVectorLayer";
import EllipsisRasterLayer from "./EllipsisRasterLayer";
import EllipsisApi from "./EllipsisApi";

//Factory wrapper to make this backwards compatible.
// const EllipsisVectorLayerFactory = (...params) => new EllipsisVectorLayer(...params);

export { EllipsisApi, EllipsisVectorLayer, EllipsisRasterLayer }