import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 1. Fix default marker icon paths in bundled / Vite environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 2. Safeguard L.DomUtil.getPosition against undefined element (prevents TypeError: Cannot read properties of undefined (reading '_leaflet_pos'))
if (L.DomUtil) {
  const originalGetPosition = L.DomUtil.getPosition;
  L.DomUtil.getPosition = function (el: any) {
    if (!el || typeof el !== 'object') {
      return new L.Point(0, 0);
    }
    try {
      if (el._leaflet_pos) {
        return el._leaflet_pos;
      }
      if (originalGetPosition) {
        return originalGetPosition(el);
      }
      return new L.Point(0, 0);
    } catch {
      return new L.Point(0, 0);
    }
  };
}

// 3. Safeguard Map prototype methods
if (L.Map && L.Map.prototype) {
  // Prevent "Error: Map container is already initialized" during React StrictMode or quick re-mounts
  const originalInitContainer = (L.Map.prototype as any)._initContainer;
  if (originalInitContainer) {
    (L.Map.prototype as any)._initContainer = function (id: any) {
      const container = typeof id === 'string' ? document.getElementById(id) : id;
      if (container && (container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }
      return originalInitContainer.call(this, id);
    };
  }

  // Prevent internal getPosition(this._mapPane) from crashing if mapPane is detached or unmounted
  (L.Map.prototype as any)._getMapPanePos = function () {
    if (!this._mapPane) {
      return new L.Point(0, 0);
    }
    try {
      return (this._mapPane as any)._leaflet_pos || new L.Point(0, 0);
    } catch {
      return new L.Point(0, 0);
    }
  };

  // Prevent webkit fallback timeout from firing on unmounted/removed map
  const originalOnZoomTransitionEnd = (L.Map.prototype as any)._onZoomTransitionEnd;
  (L.Map.prototype as any)._onZoomTransitionEnd = function () {
    if (!this._mapPane || !this._loaded || !this._container) {
      this._animatingZoom = false;
      return;
    }
    try {
      if (originalOnZoomTransitionEnd) {
        originalOnZoomTransitionEnd.call(this);
      }
    } catch {
      this._animatingZoom = false;
    }
  };

  // Safe map removal
  const originalRemove = (L.Map.prototype as any).remove;
  if (originalRemove) {
    (L.Map.prototype as any).remove = function () {
      try {
        this.stop();
        this.off();
      } catch {
        // ignore
      }
      this._animatingZoom = false;
      try {
        return originalRemove.call(this);
      } catch {
        if (this._container) {
          delete (this._container as any)._leaflet_id;
        }
        return this;
      }
    };
  }
}

export default L;
