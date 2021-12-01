### Import the Ellipsis library in a mapbox-gl-js project

```html
<!-- Import Mapbox -->
<link href='https://api.mapbox.com/mapbox-gl-js/v2.5.1/mapbox-gl.css' rel='stylesheet' />
<script src='https://api.mapbox.com/mapbox-gl-js/v2.5.1/mapbox-gl.js'></script>
<!-- Import the latest version of the ellipsis library -->
<script src="https://github.com/ellipsis-drive-internal/mapboxgljs-package/releases/download/1.0.1/Ellipsis-Mapboxgljs-1.0.1.js"></script>
```

### Add an Ellipsis Drive block to a mapbox map
#### Example
```js
const map = L.map('map', {
    center: [51.505, -0.09],
    zoom: 13
});

// Raster layer
Ellipsis.RasterLayer(
    blockId,
    captureId,
    visualizationId, 
    maxZoom: 21,
    { 
	//options
        token: yourToken
    }
).addTo(map)

// Vector layer
Ellipsis.VectorLayer(
    blockId,
    layerId, 
    { 
	//options
        maxZoom: 21,
        token: yourToken
    }
).addTo(map)
```
#### RasterLayer parameters

| Name        | Description |
| ----------- | -----------|
| blockId        | id of the block|
| captureId     | id of the capture |
| visualizationId     | id of the layer |
| maxZoom        | maxZoomlevel of the layer. Default 21.|
| options | optional options object|

#### RasterLayer options
| Name | Description |
| -- | -- |
| token        | token of the user |

#### VectorLayer parameters

| Name        | Description | 
| ----------- | ----------- |
| blockId        | Id of the block |
| layerId     | Id of the layer |
| options | optional options object |

#### VectorLayer options

| Name        | Description | 
| ----------- | ----------- |
| onFeatureClick        | A function to run on feature click, with as argument the clicked feature |
| token        | Token of the user |
| styleId        | Id of the layer style|
| style | Style object* |
| filter        | A property filter to use|
| maxZoom        | maxZoomlevel of the layer. Default 21. |
| centerPoints        | Boolean whether to render only center points. Default false. |
| pageSize | Size to retreive per step. Default 25, max 3000. |
| maxMbPerTile        | The maximum mb to load per tile. Default 16mb. |
| maxTilesInCache        | The number of tiles to keep in cache. Default 500. |
| maxFeaturesPerTile        | The maximum number of features to load per tile. Default 200. |
| radius | The radius of the points in the layer. Default 15. |
| lineWidth | The width/weight of the lines in the layer. Default 5. |
| useMarkers | Use markers instead of points. Default false. |
| loadAll | Always load all vectors, even if not visible or far away. Default false |

*warning* `loadAll=true` will ignore maxMbPerTile, maxTilesInCache and maxFeaturesPerTile settings.

*onFeatureClick* gets passed two parameters: the geojson of the clicked feature and the event.

*note* for the style object, refer to this documentation about it: https://app.ellipsis-drive.com/developer/javascript/documentation#POST%20geometryLayers%2FaddStyle.
<details>
<summary>Or this copied info</summary>
○ 'rules': Parameters contains the property 'rules' being an array of objects with required properties 'property', 'value' and 'color' and optional properties 'operator' and 'alpha'. 'property' should be the name of the property to style by and should be of type string, 'value' should be the cutoff point of the style and must be the same type as the property, 'color' is the color of the style and must be a rgb hex code, 'operator'determines whether the styling should occur at, under or over the cutoff point and must be one of '=', '<', '>', '<=', '>=' or '!=' with default '=' and 'alpha' should be the transparency of the color on a 0 to 1 scale with default 0.5.

○ 'rangeToColor': Parameters contains the required property 'rangeToColor' and optional property 'periodic', where 'rangeToColor' should be an array of objects with required properties 'property', 'fromValue', 'toValue' and 'color' and optional property 'alpha', where 'property' should be the name of the property to style by and should be of type string, 'fromValue' and 'toValue' should be the minimum and maximum value of the range respectively, 'color' is the color to use if the property falls inclusively between the fromValue and toValue and should be a rgb hex code color and 'alpha' should be the transparency of the color on a 0 to 1 scale with default 0.5. 'periodic' should be a positive float used when the remainder from dividing the value of the property by the periodic should be used to evaluate the ranges instead.

○ 'transitionPoints': Parameters contains the required properties 'property' and 'transitionPoints' and optional property 'periodic', where 'property' should be the name of the property to style by and should be of type string, 'transitionPoints' should be an array of objects with required properties 'value' and 'color' and optional property 'alpha', where 'value' should be the value at which the next transition starts, 'color' is the color to use if the property falls in the interval before or after the transition point and should be a rgb hex code color and 'alpha' should be the transparency of the color on a 0 to 1 scale with 0.5 as default. 'periodic' should be a positive float used when the remainder from dividing the value of the property by the periodic should be used to evaluate the ranges instead.

○ 'random': Parameters contains the required property 'property' and optional property 'alpha', where 'property' should be the name of the property by which to randomly assign colors and should be of type string and 'alpha' should be the transparency of the color on a 0 to 1 scale with default 0.5.
</details>

#### VectorLayer styling

A vectorlayer can add multiple style layers to your mapbox map. To view all added styling, call `yourVectorLayer.getLayers()`. You can also get and use the source that contains geojson with `yourVectorLayer.getSource()`.

### Use the EllipsisApi to login into Ellipsis Drive or view metadata of blocks

#### EllipsisApi.login description
**parameters**
| name | description | 
| -- | -- |
| username | The username of your ellipsis-drive account |
| password | The password of your ellipsis-drive account |
| validFor | (Optional) The number of second the access token will be valid for. Default 86400 (24 hours). |

**return value**
```ts
token: string //token to use in other api calls
expires: number //expiration time in milliseconds
```

#### EllipsisApi.getMetadata description
**parameters**
| name | description | 
| -- | -- |
| blockId | The block or shape id of the project. |
| includeDeleted | (Optional) Boolean whether to also return deleted items. Default false. |
| user | (Optional) An user object which can contain a token like `user: {token: mytoken}` | 

**return value**

It returns JSON, which depends on the type of map.


