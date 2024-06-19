### Import the Ellipsis library in a mapbox-gl-js project

**with script tags**

```html
<!-- Import Mapbox -->
<link
  href="https://api.mapbox.com/mapbox-gl-js/v2.5.1/mapbox-gl.css"
  rel="stylesheet"
/>
<script src="https://api.mapbox.com/mapbox-gl-js/v2.5.1/mapbox-gl.js"></script>
<!-- Import the latest version of the ellipsis library -->
<script src="https://github.com/ellipsis-drive/ellipsis-js-util/releases/download/1.3.3/ellipsis-js-util-1.3.3.js"></script>
<script src="https://github.com/ellipsis-drive/mapboxgljs-package/releases/download/3.1.2/mapboxgljs-ellipsis-3.1.2.js"></script>
```

**with npm**
`npm install mapboxgljs-ellipsis`

### Add an Ellipsis Drive layer to a mapbox map

#### Example

```js
import {
	EllipsisVectorLayer,
	EllipsisRasterLayer,
	AsyncEllipsisRasterLayer,
} from 'mapboxgljs-ellipsis';


const map = L.map("map", {
  center: [51.505, -0.09],
  zoom: 13,
});

// Raster layer
new EllipsisRasterLayer({
  pathId,
  timestampId,
  style:styleId,
  token: yourToken,
}).addTo(map);

// Vector layer
new EllipsisVectorLayer({
  pathId,
  token: yourToken,
}).addTo(map);
```

The timestampId and style are required for raster layers, you can use AsyncEllipsisRasterLayer in order to make use of defaults suggested by the server.
```js

const createEllipsisRasterLayer = async () => {
  const someRaster = await MapboxgljsEllipsis.AsyncEllipsisRasterLayer({
    pathId: "28fb0f5f-e367-4265-b84b-1b8f1a8a6409",
  });
  someRaster.addTo(map);
};

createEllipsisRasterLayer();
```


#### Obtaining tokens
To use layers that are not set to public or link sharing you need to pass a token as a parameter. See [here](https://docs.ellipsis-drive.com/developers/authentication-options) for how to obtain such a token.

#### RasterLayer options

| Name        | Description                                |
| ----------- | ------------------------------------------ |
| pathId      | id of the path                             |
| timestampId | id of the timestamp                        |
| style       | id of the style or an object describing it |
| maxZoom     | maxZoomlevel of the layer. Default 21.     |
| token       | token of the user                          |

_note_ for the style object, refer to [this documentation about it](https://docs.ellipsis-drive.com/developers/api-v3/path-raster/styles/add-style).

#### VectorLayer options

| Name               | Description                                                              |
| ------------------ | ------------------------------------------------------------------------ |
| pathId             | Id of the path                                                           |
| timestampId            | Id of the timestamp                                                          |
| style       | id of the style or an object describing it |
| onFeatureClick     | A function to run on feature click, with as argument the clicked feature |
| token              | Token of the user                                                        |
| filter             | A property filter to use                                                 |
| maxZoom            | maxZoomlevel of the layer. Default 21.                                   |
| centerPoints       | Boolean whether to render only center points. Default false.             |
| pageSize           | Size to retreive per step. Default 25, max 3000.                         |
| maxMbPerTile       | The maximum mb to load per tile. Default 16mb.                           |
| maxRenderTiles    | The number of tiles to keep in view. Default 500.                       |
| maxFeaturesPerTile | The maximum number of features to load per tile. Default 200.            |
| fetchInterval      | The interval in ms between finishing and starting a request. Default 0   |

_warning_ `loadAll=true` will ignore maxMbPerTile, maxTilesInCache and maxFeaturesPerTile settings.

_onFeatureClick_ gets passed two parameters: the geojson of the clicked feature and the event.

_note_ for the style object, refer to [this documentation about it](https://docs.ellipsis-drive.com/developers/api-v3/path-vector/styles/add-style).

#### VectorLayer styling

A vectorlayer can add multiple style layers to your mapbox map. To view all added styling, call `yourVectorLayer.getLayers()`. You can also get and use the source that contains geojson with `yourVectorLayer.getSource()`.

### Use the EllipsisApi to view metadata of layers



#### EllipsisApi.getInfo description

**parameters**
| name | description |
| -- | -- |
| pathId | The id of the folder or layer. |
| user | (Optional) An user object which can contain a token like `user: {token: mytoken}` |

**return value**
It returns JSON, which depends on the type of the specified object.
