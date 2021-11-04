class EllipsisRasterLayer {

    constructor(blockId, captureId, visualizationId, maxZoom = 18, token) {
        this.id = `${blockId}_${captureId}_${visualizationId}`;
        this.source = `${this.id}_source`;
        this.type = 'raster';
        this.url = `${EllipsisApi.apiUrl}/tileService/${blockId}/${captureId}/${visualizationId}/{z}/{x}/{y}`;
        if (token) {
            url += '?token=' + token;
        }
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

