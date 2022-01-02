import EllipsisVectorLayer from "./EllipsisVectorLayer";
import EllipsisRasterLayer from "./EllipsisRasterLayer";

//Factory wrapper to make this backwards compatible.
// const EllipsisVectorLayerFactory = (...params) => new EllipsisVectorLayer(...params);

const Ellipsis = {
    RasterLayer: (blockId, captureId, visualizationId, options) => {
        return new EllipsisRasterLayer({ blockId, captureId, visualizationId, ...options });
    },
    VectorLayer: (blockId, layerId, options) => {
        return new EllipsisVectorLayer({ blockId, layerId, ...options });
    }
}

export { EllipsisVectorLayer, EllipsisRasterLayer, Ellipsis }