import EllipsisVectorLayer from "./EllipsisVectorLayer";
import EllipsisRasterLayer from "./EllipsisRasterLayer";
import AsyncEllipsisRasterLayer from "./AsyncEllipsisRasterLayer";
import getEllipsisUtilObject from "./getEllipsisUtilObject";

const EllipsisApi = getEllipsisUtilObject("EllipsisApi");

export default {
  RasterLayer: (options) => {
    return new EllipsisRasterLayer(options);
  },
  VectorLayer: (options) => {
    return new EllipsisVectorLayer(options);
  },
  AsyncEllipsisRasterLayer: async (options) => {
    return await AsyncEllipsisRasterLayer(options);
  },
  EllipsisApi,
};

export {
  EllipsisVectorLayer,
  EllipsisRasterLayer,
  EllipsisApi,
  AsyncEllipsisRasterLayer,
};
