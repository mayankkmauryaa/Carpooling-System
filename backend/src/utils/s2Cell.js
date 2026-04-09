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
  
  static interleaveBits(x, y) {
    let result = 0;
    for (let i = 0; i < 32; i++) {
      result |= ((x >> i) & 1) << (2 * i);
      result |= ((y >> i) & 1) << (2 * i + 1);
    }
    return result;
  }
}

module.exports = S2CellManager;
