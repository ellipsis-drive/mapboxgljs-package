import { EllipsisVectorLayerBase } from 'ellipsis-js-util';

class EllipsisVectorLayer {
    constructor(options = {}) {
        this.ellipsisLayer = new EllipsisVectorLayerBase({
            ...options,
            updateView: this.updateView,
            getMapBounds: this.getMapBounds,
            featureFormatter: this.formatFeature
        });

        this.sourceId = `${this.ellipsisLayer.id}_source`;
    }

    /**
     * @returns mapbox geojson source that the layer is using
     */
    getSource() {
        return this.source;
    }

    /**
     * @returns mapbox layers
     */
    getLayers() {
        if (!this.map) return [];
        if (!this.map.getStyle() || !this.map.getStyle().layers) return [];
        return this.map.getStyle().layers.filter(x => x.id.startsWith(this.ellipsisLayer.id));
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
            id: `${this.ellipsisLayer.id}_fill`,
            type: 'fill',
            interactive: this.ellipsisLayer.onFeatureClick ? true : false,
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
            id: `${this.ellipsisLayer.id}_outline`,
            type: 'line',
            interactive: this.ellipsisLayer.onFeatureClick ? true : false,
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

        if (!this.ellipsisLayer.useMarkers)
            map.addLayer({
                id: `${this.ellipsisLayer.id}_points`,
                type: 'circle',
                interactive: this.ellipsisLayer.onFeatureClick ? true : false,
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
        if (this.ellipsisLayer.onFeatureClick) {
            this.getLayers().forEach(x => {
                map.on('click', x.id, (e) => this.ellipsisLayer.onFeatureClick({ geometry: e.features[0].geometry, properties: e.features[0].properties }, x));
            });
            map.on('mouseenter', `${this.ellipsisLayer.id}_fill`, () => map.getCanvas().style.cursor = 'pointer');
            map.on('mouseleave', `${this.ellipsisLayer.id}_fill`, () => map.getCanvas().style.cursor = '');
            map.on('mouseenter', `${this.ellipsisLayer.id}_points`, () => map.getCanvas().style.cursor = 'pointer');
            map.on('mouseleave', `${this.ellipsisLayer.id}_points`, () => map.getCanvas().style.cursor = '');
        }

        this.source = map.getSource(this.sourceId);

        this.ellipsisLayer.update();

        if (this.ellipsisLayer.loadAll) return this;

        map.on("zoom", (x) => {
            this.ellipsisLayer.update();
        });

        map.on("moveend", (x) => {
            this.ellipsisLayer.update();
        });
        return this;
    }

    updateView = () => {
        const features = this.ellipsisLayer.getFeatures();
        if (!features || !features.length) return;

        if (this.ellipsisLayer.useMarkers) {
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
                if (this.ellipsisLayer.onFeatureClick) {
                    x.getElement().addEventListener('click', this.ellipsisLayer.onFeatureClick);
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

    formatFeature = (feature) => {
        if (!feature || !feature.geometry || !feature.geometry.type || !feature.properties)
            return;

        const properties = feature.properties;
        const color = properties.color;

        let hex = '000000', alpha = 0.5;
        if (color) {
            const splitHexComponents = /^#?([a-f\d]{6})([a-f\d]{2})?$/i.exec(color);
            if (splitHexComponents.length >= 2) {
                hex = splitHexComponents[1];
                alpha = parseInt(splitHexComponents[2], 16) / 255;
                if (isNaN(alpha)) alpha = 0.5;
            }
        }

        properties.fillOpacity = alpha;
        properties.color = `#${hex}`;
        properties.weight = this.ellipsisLayer.lineWidth;

        if (feature.geometry.type.endsWith('Point'))
            properties.radius = this.ellipsisLayer.radius;
    }

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

export default EllipsisVectorLayer;