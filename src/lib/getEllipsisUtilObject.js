const ellipsisUtil = require('ellipsis-js-util');

export default (objectName) => {
    if (ellipsisUtil) return ellipsisUtil[objectName];
    return window.EllipsisUtil[objectName];
}