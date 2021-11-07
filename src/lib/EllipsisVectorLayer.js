"use strict"

class EllipsisVectorLayer {
    constructor(
        blockId,
        layerId,
        selectFeature,
        token,
        styleId,
        filter,
        centerPoints,
        maxZoom,
        pageSize,
        maxMbPerTile,
        maxTilesInCache,
        maxFeaturesPerTile,
        radius,
        lineWidth
    ) {
        this.id = `${blockId}_${layerId}`;
        this.sourceId = `${this.id}_source`;

        this.blockId = blockId;
        this.layerId = layerId;
        this.maxZoom = maxZoom;
        this.selectFeatureParam = selectFeature;
        this.token = token;
        this.styleId = styleId;
        this.filter = filter;
        this.centerPoints = centerPoints;
        this.pageSize = Math.min(pageSize, 3000);
        this.maxMbPerTile = maxMbPerTile;
        this.maxTilesInCache = maxTilesInCache;
        this.maxFeaturesPerTile = maxFeaturesPerTile;
        this.radius = radius;
        this.lineWidth = lineWidth;

        this.tiles = [];
        this.cache = [];
        this.zoom = 1;
        this.changed = false;
    }

    /**
     * @returns mapbox geojson source that the layer is using
     */
    getSource() {
        return this.source;
    }

    /**
     * @returns mapbox layer
     */
    getLayers() {
        if(!this.map) return [];
        if(!this.map.getStyle() || !this.map.getStyle().layers) return [];
        return this.map.getStyle().layers.filter(x => x.id.startsWith(this.id));
    }

    addTo(map) {
        this.map = map;

        
        map.addSource(this.sourceId, {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: []
            }
        });
        map.addLayer({
            id: `${this.id}_fill`,
            type: 'fill',
            source: this.sourceId,
            layout: {},
            paint: {
                'fill-color': ['get', 'color'],
                'fill-opacity': ['get', 'fillOpacity']
            },
            filter: ['any',
                ['==', '$type', 'Polygon'],
            ]
        });
        map.addLayer({
            id: `${this.id}_outline`,
            type: 'line',
            source: this.sourceId,
            layout: {},
            paint: {
                'line-color': ['get', 'color'],
                'line-width': ['get', 'weight']
            },
            filter: ['any',
                ['==', '$type', 'Polygon'],
                ['==', '$type', 'LineString']
            ]
        });
        map.addLayer({
            id: `${this.id}_points`,
            type: 'circle',
            source: this.sourceId,
            layout: {},
            paint: {
                'circle-radius': ['get', 'radius'],
                'circle-color': ['get', 'color']
            },
            filter: ['any',
                ['==', '$type', 'Point']
            ]
        });

        this.source = map.getSource(this.sourceId);

        this.registerViewportUpdate();
        this.viewPortRefreshed = true;

        this.gettingVectorsInterval = setInterval(async () => {
            let loadedSomething = await this.getVectors();
            this.updateView(loadedSomething);
        }, 100);

        map.on("zoom", (x) => {
            this.registerViewportUpdate();
            this.viewPortRefreshed = true;
        });

        map.on("moveend", (x) => {
            this.registerViewportUpdate();
            this.viewPortRefreshed = true;
        });
        //TODO clear interval somewhere
        return this;
    }

    registerViewportUpdate = () => {
        const viewport = getMapBounds(this.map);
        if (!viewport) return;
        this.zoom = Math.max(Math.min(this.maxZoom, viewport.zoom - 2), 0);
        this.tiles = boundsToTiles(viewport.bounds, this.zoom);
    };

    getVectors = async () => {
        if (this.gettingVectors) return true;
        this.gettingVectors = true;
        const now = Date.now();

        //clear cache
        const keys = Object.keys(this.cache);
        if (keys.length > this.maxTilesInCache) {
            const dates = keys.map((k) => this.cache[k].date).sort();
            const clipValue = dates[9];
            keys.forEach((key) => {
                if (this.cache[key].date <= clipValue) {
                    delete this.cache[key];
                }
            });
        }
        const cachedSomething = await this.cacheGeoJsons(now);
        this.gettingVectors = false;
        return cachedSomething;
    };

    cacheGeoJsons = async (date) => {
        
        //create tiles parameter which contains tiles that need to load more features
        const tiles = this.tiles.map((t) => {
            const tileId = getTileId(t);

            //If not cached, always try to load features.
            if(!this.cache[tileId]) 
                return { tileId: t}

            const pageStart = this.cache[tileId].nextPageStart;

            //TODO in other packages we use < instead of <=
            //Check if tile is not already fully loaded, and if more features may be loaded
            if(pageStart && this.cache[tileId].amount <= this.maxFeaturesPerTile && this.cache[tileId].size <= this.maxMbPerTile)
                return { tileId: t, pageStart }

            return null;
        }).filter(x => x);
        
        // console.log("tiles:");
        // console.log(tiles);

        if(tiles.length === 0) return false;

        const body = {
            mapId: this.blockId,
            returnType: this.centerPoints ? "center" : "geometry",
            layerId: this.layerId,
            zip: true,
            pageSize: Math.min(3000, this.pageSize),
            styleId: this.styleId,
            propertyFilter: (this.filter && this.filter > 0) ? this.filter : null,
        };
    
        //Get new geometry for the tiles
        let result = [];
        const chunkSize = 10;
        for (let k = 0; k < tiles.length; k += chunkSize) {
            body.tiles = tiles.slice(k, k + chunkSize);
            try {
                // console.log(body);
                const res = await EllipsisApi.post("/geometry/tile", body, this.token);
                result = result.concat(res);
            } catch {
                return false;
            }
        }
        
        //Add newly loaded data to cache
        for (let j = 0; j < tiles.length; j++) {
            const tileId = getTileId(tiles[j].tileId);

            if (!this.cache[tileId]) {
                this.cache[tileId] = {
                    size: 0,
                    amount: 0,
                    elements: [],
                    nextPageStart: null,
                };
            }
    
            //set tile info for tile in this.
            const tileData = this.cache[tileId];
            tileData.date = date;
            tileData.size = tileData.size + result[j].size;
            tileData.amount = tileData.amount + result[j].result.features.length;
            tileData.nextPageStart = result[j].nextPageStart;
            result[j].result.features.forEach(x => styleGeoJson(x));
            tileData.elements = tileData.elements.concat(result[j].result.features);
    
            //TODO add onFeatureClick function support
            //TODO add default layer style with createGeoJsonLayerStyle
        }
        return true;
    };

    updateView = (loading) => {
        if (!this.tiles || this.tiles.length === 0) return;

        //No need to update the view if there's no change in the viewport.
        //Reduces about 1-3 ms of calculations when map is not moving.
        if(!this.viewPortRefreshed) return;

        const features = this.tiles.flatMap((t) => {
            const geoTile = this.cache[getTileId(t)];
            return geoTile ? geoTile.elements : [];
        });

        this.getSource().setData({
            type: "FeatureCollection",
            features: features
        });

        if(!loading) this.viewPortRefreshed = false;
    };

    selectFeature = async (feature) => {
        let body = {
            mapId: this.blockId,
            layerId: this.layerId,
            geometryIds: [feature.properties.id],
            returnType: "all",
        };
        try {
            let result = await EllipsisApi.post(
                "/geometry/ids",
                body,
                this.token
            );
            this.selectFeature({
                size: result.size,
                feature: result.result.features[0],
            });
        } catch (e) {
            console.log(e);
        }
    };
}

const getTileId = (tile) => `${tile.zoom}_${tile.tileX}_${tile.tileY}`;

const styleGeoJson = (geoJson, weight, radius) => {
    if(!geoJson || !geoJson.geometry || !geoJson.geometry.type || !geoJson.properties) return;

    const type = geoJson.geometry.type;
    const properties = geoJson.properties;
    const color = properties.color;
    const isHexColorFormat = /^#?([A-Fa-f0-9]{2}){3,4}$/.test(color);

    if(type === 'MultiPolygon' || type === 'Polygon') {
        //TODO fix mistake in other packages where color length is compared with 10
        if(isHexColorFormat && color.length === 9)
            properties.fillOpacity = parseInt(color.substring(8,10), 16) / 25.5;
        else properties.fillOpacity = 0.6;
        properties.weight = weight;
    }
    //TODO: weight default on 8 for LineString and MultiLineString?

    else if(type === 'Point' || type === 'MultiPoint') {
        //TODO: weight default on 8 for LineString and MultiLineString?
        properties.radius = radius;
        properties.weight = 2;
    }

    if(isHexColorFormat && color.length === 9)
        properties.color = color.substring(0,7);
    //TODO asMarker in other packages is always false?
}

const boundsToTiles = (bounds, zoom) => {
    const xMin = Math.max(bounds.xMin, -180);
    const xMax = Math.min(bounds.xMax, 180);
    const yMin = Math.max(bounds.yMin, -85);
    const yMax = Math.min(bounds.yMax, 85);

    const zoomComp = Math.pow(2, zoom);
    const comp1 = zoomComp / 360;
    const pi = Math.PI;
    const comp2 = 2 * pi;
    const comp3 = pi / 4;

    const tileXMin = Math.floor((xMin + 180) * comp1);
    const tileXMax = Math.floor((xMax + 180) * comp1);
    const tileYMin = Math.floor(
        (zoomComp / comp2) *
            (pi - Math.log(Math.tan(comp3 + (yMax / 360) * pi)))
    );
    const tileYMax = Math.floor(
        (zoomComp / comp2) *
            (pi - Math.log(Math.tan(comp3 + (yMin / 360) * pi)))
    );

    let tiles = [];
    for (
        let x = Math.max(0, tileXMin - 1);
        x <= Math.min(2 ** zoom - 1, tileXMax + 1);
        x++
    ) {
        for (
            let y = Math.max(0, tileYMin - 1);
            y <= Math.min(2 ** zoom - 1, tileYMax + 1);
            y++
        ) {
            tiles.push({ zoom, tileX: x, tileY: y });
        }
    }
    return tiles;
};

const getMapBounds = (map) => {
    if (!map || !map.transform.zoom) return;

    const screenBounds = map.getBounds();

    let bounds = {
        xMin: screenBounds.getWest(),
        xMax: screenBounds.getEast(),
        yMin: screenBounds.getSouth(),
        yMax: screenBounds.getNorth(),
    };

    //Mapbox uses 512x512 tiles, and ellipsis uses 256x256 tiles. So increase zoom with 1. 'zoom256 = zoom512 + 1'
    return { bounds: bounds, zoom: parseInt(map.getZoom() + 1, 10) };
};
