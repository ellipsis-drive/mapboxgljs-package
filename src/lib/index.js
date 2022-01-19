import EllipsisVectorLayer from "./EllipsisVectorLayer";
import EllipsisRasterLayer from "./EllipsisRasterLayer";
import getEllipsisUtilObject from "./getEllipsisUtilObject";
const EllipsisApi = getEllipsisUtilObject('EllipsisApi');

export default {
    RasterLayer: (blockId, captureId, visualizationId, maxZoom = 21, options = {}) => {
        return new EllipsisRasterLayer({ blockId, captureId, visualizationId, maxZoom, ...options });
    },
    VectorLayer: (blockId, layerId, options = {}) => {
        return new EllipsisVectorLayer({ blockId, layerId, ...options });
    },
    EllipsisApi
}

export { EllipsisVectorLayer, EllipsisRasterLayer, EllipsisApi }