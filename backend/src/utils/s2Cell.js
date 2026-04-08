class S2CellManager {
  static EARTH_RADIUS = 6371;
  
  static CELL_SIZE = 3;
  
  static latLngToCellId(lat, lng, level = 15) {
    const normalizedLat = (lat + 90) / 180;
    const normalizedLng = (lng + 180) / 360;
    
    const cellSize = Math.pow(2, level);
    const x = Math.floor(normalizedLng * cellSize);
    const y = Math.floor(normalizedLat * cellSize);
    
    return this.interleaveBits(x, y);
  }
  
  static getNeighborCells(cellId, radius = 1) {
    const neighbors = [];
    const decoded = this.decodeCellId(cellId);
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const neighborX = decoded.x + dx;
        const neighborY = decoded.y + dy;
        
        if (neighborX >= 0 && neighborY >= 0) {
          neighbors.push(this.interleaveBits(neighborX, neighborY));
        }
      }
    }
    
    return neighbors;
  }
  
  static interleaveBits(x, y) {
    let result = 0;
    for (let i = 0; i < 32; i++) {
      result |= ((x >> i) & 1) << (2 * i);
      result |= ((y >> i) & 1) << (2 * i + 1);
    }
    return result;
  }
  
  static decodeCellId(cellId) {
    let x = 0, y = 0;
    for (let i = 0; i < 32; i++) {
      x |= ((cellId >> (2 * i)) & 1) << i;
      y |= ((cellId >> (2 * i + 1)) & 1) << i;
    }
    return { x, y };
  }
  
  static cellIdToLatLng(cellId) {
    const decoded = this.decodeCellId(cellId);
    const cellSize = Math.pow(2, 15);
    
    return {
      lat: (decoded.y / cellSize) * 180 - 90,
      lng: (decoded.x / cellSize) * 360 - 180
    };
  }
  
  static getCellBounds(cellId) {
    const decoded = this.decodeCellId(cellId);
    const cellSize = Math.pow(2, 15);
    
    const minLng = (decoded.x / cellSize) * 360 - 180;
    const maxLng = ((decoded.x + 1) / cellSize) * 360 - 180;
    const minLat = (decoded.y / cellSize) * 180 - 90;
    const maxLat = ((decoded.y + 1) / cellSize) * 180 - 90;
    
    return { minLat, maxLat, minLng, maxLng };
  }
}

module.exports = S2CellManager;
