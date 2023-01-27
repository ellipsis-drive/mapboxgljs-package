import getEllipsisUtilObject from "./getEllipsisUtilObject";
const RasterLayerUtil = getEllipsisUtilObject("RasterLayerUtil");
import EllipsisRasterLayer from "./EllipsisRasterLayer";

const AsyncEllipsisRasterLayer = async (options) => {
  let newOptions = await RasterLayerUtil.getSlippyMapUrlWithDefaults(options);

  return new EllipsisRasterLayer(newOptions);
};

export default AsyncEllipsisRasterLayer;
