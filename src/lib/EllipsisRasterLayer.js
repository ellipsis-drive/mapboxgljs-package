import { RasterLayerUtil } from 'ellipsis-js-util';

class EllipsisRasterLayer {

    constructor(options = {}) {
        this.url = RasterLayerUtil.getSlippyMapUrl(options);
        this.id = `${options.blockId}_${options.captureId}_${options.visualizationId}`;
        this.source = `${this.id}_source`;
        this.type = 'raster';
    }

    addTo(map) {
        map.addSource(this.source, {
            type: 'raster',
            tiles: [
                this.url
            ],
            tileSize: 128
        });

        map.addLayer(this);
        return this;
    }
}

export default EllipsisRasterLayer;
