"use strict"

class EllipsisVectorLayer {
    constructor(
        blockId,
        layerId,
        onFeatureClick,
        token,
        styleId,
        style,
        filter,
        centerPoints,
        maxZoom,
        pageSize,
        maxMbPerTile,
        maxTilesInCache,
        maxFeaturesPerTile,
        radius,
        lineWidth,
        useMarkers,
        loadAll
    ) {
        this.id = `${blockId}_${layerId}`;
        this.sourceId = `${this.id}_source`;

        this.blockId = blockId;
        this.layerId = layerId;
        this.maxZoom = maxZoom;
        //TODO fix this in other packages
        this.onFeatureClick = onFeatureClick;
        this.token = token;
        this.styleId = styleId;
        this.style = style;
        this.filter = filter;
        this.centerPoints = centerPoints;
        this.pageSize = Math.min(pageSize, 3000);
        this.maxMbPerTile = maxMbPerTile;
        this.maxTilesInCache = maxTilesInCache;
        this.maxFeaturesPerTile = maxFeaturesPerTile;
        this.radius = radius;
        this.lineWidth = lineWidth;
        this.useMarkers = useMarkers;
        this.loadAll = loadAll;

        this.tiles = [];
        this.cache = [];
        this.markers = [];
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
        if (!this.map) return [];
        if (!this.map.getStyle() || !this.map.getStyle().layers) return [];
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
            interactive: this.onFeatureClick ? true : false,
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
            interactive: this.onFeatureClick ? true : false,
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

        if (!this.useMarkers)
            map.addLayer({
                id: `${this.id}_points`,
                type: 'circle',
                interactive: this.onFeatureClick ? true : false,
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

        //Handle feature clicks and mouse styling
        if (this.onFeatureClick) {
            this.getLayers().forEach(x => {
                map.on('click', x.id, (e) => this.onFeatureClick({ geometry: e.features[0].geometry, properties: e.features[0].properties }, x));
            });
            map.on('mouseenter', `${this.id}_fill`, () => map.getCanvas().style.cursor = 'pointer');
            map.on('mouseleave', `${this.id}_fill`, () => map.getCanvas().style.cursor = '');
            map.on('mouseenter', `${this.id}_points`, () => map.getCanvas().style.cursor = 'pointer');
            map.on('mouseleave', `${this.id}_points`, () => map.getCanvas().style.cursor = '');
        }

        this.source = map.getSource(this.sourceId);

        this.handleViewportUpdate();

        if (this.loadAll) return this;

        map.on("zoom", (x) => {
            this.handleViewportUpdate();
        });

        map.on("moveend", (x) => {
            this.handleViewportUpdate();
        });
        return this;
    }

    handleViewportUpdate = () => {
        const viewport = this.getMapBounds();
        if (!viewport) return;
        this.zoom = Math.max(Math.min(this.maxZoom, viewport.zoom - 2), 0);
        this.tiles = this.boundsToTiles(viewport.bounds, this.zoom);

        if (this.gettingVectorsInterval) return;

        this.gettingVectorsInterval = setInterval(async () => {
            if (this.isLoading) return;

            const loadedSomething = await this.loadStep();
            if (!loadedSomething) {
                clearInterval(this.gettingVectorsInterval);
                this.gettingVectorsInterval = undefined;
                return;
            }
            this.updateView();
        }, 100);
    };

    updateView = () => {
        if (!this.tiles || this.tiles.length === 0) return;

        let features;
        if (this.loadAll) {
            features = this.cache;
        } else {
            features = this.tiles.flatMap((t) => {
                const geoTile = this.cache[this.getTileId(t)];
                return geoTile ? geoTile.elements : [];
            });
        }

        if (this.useMarkers) {
            let points = features.flatMap((x) => {
                if (x.geometry.type === 'Point') {
                    return new mapboxgl.Marker({ color: x.properties.color }).setLngLat(x.geometry.coordinates);
                } else if (x.geometry.type === 'MultiPoint') {
                    return x.geometry.coordinates.map(c => new mapboxgl.Marker({ color: x.properties.color }).setLngLat(c));
                }
                return [];
            });
            this.markers.forEach(x => x.remove());
            points.forEach(x => {
                if (this.onFeatureClick) {
                    x.getElement().addEventListener('click', this.onFeatureClick);
                }
                x.addTo(this.map);
                this.markers.push(x);
            });
        }

        this.getSource().setData({
            type: "FeatureCollection",
            features: features
        });
    };

    loadStep = async () => {
        this.isLoading = true;
        if (this.loadAll) {
            const cachedSomething = await this.getAndCacheAllGeoJsons();
            this.isLoading = false;
            return cachedSomething;
        }

        this.ensureMaxCacheSize();
        const cachedSomething = await this.getAndCacheGeoJsons();
        this.isLoading = false;
        return cachedSomething;
    };

    ensureMaxCacheSize = () => {
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
    };

    getAndCacheAllGeoJsons = async () => {
        if (this.nextPageStart === 4)
            return false;

        const body = {
            pageStart: this.nextPageStart,
            mapId: this.blockId,
            returnType: this.centerPoints ? "center" : "geometry",
            layerId: this.layerId,
            zip: true,
            pageSize: Math.min(3000, this.pageSize),
            styleId: this.styleId,
            style: this.style
        };

        try {
            const res = await EllipsisApi.post("/geometry/get", body, { token: this.token });
            this.nextPageStart = res.nextPageStart;
            if (!res.nextPageStart)
                this.nextPageStart = 4; //EOT
            if (res.result && res.result.features) {
                res.result.features.forEach(x => {
                    this.styleGeoJson(x, this.lineWidth, this.radius);
                    this.cache.push(x);
                });
            }
        } catch {
            return false;
        }
        return true;
    }

    getAndCacheGeoJsons = async () => {
        const date = Date.now();
        //create tiles parameter which contains tiles that need to load more features
        const tiles = this.tiles.map((t) => {
            const tileId = this.getTileId(t);

            //If not cached, always try to load features.
            if (!this.cache[tileId])
                return { tileId: t }

            const pageStart = this.cache[tileId].nextPageStart;

            //TODO in other packages we use < instead of <=
            //Check if tile is not already fully loaded, and if more features may be loaded
            if (pageStart && this.cache[tileId].amount <= this.maxFeaturesPerTile && this.cache[tileId].size <= this.maxMbPerTile)
                return { tileId: t, pageStart }

            return null;
        }).filter(x => x);

        // console.log("tiles:");
        // console.log(tiles);

        if (tiles.length === 0) return false;

        const body = {
            mapId: this.blockId,
            returnType: this.centerPoints ? "center" : "geometry",
            layerId: this.layerId,
            zip: true,
            pageSize: Math.min(3000, this.pageSize),
            styleId: this.styleId,
            style: this.style,
            propertyFilter: (this.filter && this.filter > 0) ? this.filter : null,
        };

        //Get new geometry for the tiles
        let result = [];
        const chunkSize = 10;
        for (let k = 0; k < tiles.length; k += chunkSize) {
            body.tiles = tiles.slice(k, k + chunkSize);
            try {
                const res = await EllipsisApi.post("/geometry/tile", body, { token: this.token });
                result = result.concat(res);
            } catch {
                return false;
            }
        }

        //Add newly loaded data to cache
        for (let j = 0; j < tiles.length; j++) {
            const tileId = this.getTileId(tiles[j].tileId);

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
            result[j].result.features.forEach(x => this.styleGeoJson(x, this.lineWidth, this.radius));
            tileData.elements = tileData.elements.concat(result[j].result.features);

        }
        return true;
    };

    getTileId = (tile) => `${tile.zoom}_${tile.tileX}_${tile.tileY}`;

    styleGeoJson = (geoJson, weight, radius) => {
        if (!geoJson || !geoJson.geometry || !geoJson.geometry.type || !geoJson.properties) return;

        const type = geoJson.geometry.type;
        const properties = geoJson.properties;
        const color = properties.color;
        const isHexColorFormat = /^#?([A-Fa-f0-9]{2}){3,4}$/.test(color);

        //Parse color and opacity
        if (isHexColorFormat && color.length === 9) {
            properties.fillOpacity = parseInt(color.substring(8, 10), 16) / 25.5;
            properties.color = color.substring(0, 7);
        }
        else {
            properties.fillOpacity = 0.6;
            properties.color = color;
        }

        //Parse line width
        if (type.endsWith('Point')) {
            properties.radius = radius;
            properties.weight = 2;
        }
        else properties.weight = weight;
    }

    boundsToTiles = (bounds, zoom) => {
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

    getMapBounds = () => {
        if (!this.map) return;

        const screenBounds = this.map.getBounds();
        const zoom = this.map.getZoom();
        let bounds = {
            xMin: screenBounds.getWest(),
            xMax: screenBounds.getEast(),
            yMin: screenBounds.getSouth(),
            yMax: screenBounds.getNorth(),
        };

        //Mapbox uses 512x512 tiles, and ellipsis uses 256x256 tiles. So increase zoom with 1. 'zoom256 = zoom512 + 1'
        return { bounds: bounds, zoom: parseInt(zoom + 1, 10) };
    };

}
