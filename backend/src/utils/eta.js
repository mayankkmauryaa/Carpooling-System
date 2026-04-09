class ETACalculator {
  static AVERAGE_SPEEDS = {
    light: 50,
    moderate: 35,
    heavy: 20,
    peak: 15
  };
  
  static calculate(distanceKm, trafficCondition = 'moderate') {
    const speed = this.AVERAGE_SPEEDS[trafficCondition] || this.AVERAGE_SPEEDS.moderate;
    
    const travelTimeHours = distanceKm / speed;
    const travelTimeMinutes = travelTimeHours * 60;
    
    const stopBuffer = Math.min(distanceKm, 10);
    
    return Math.round(travelTimeMinutes + stopBuffer);
  }
  
  static withStops(distanceKm, numberOfStops, trafficCondition = 'moderate') {
    const baseTime = this.calculate(distanceKm, trafficCondition);
    const stopTime = numberOfStops * 5;
    return baseTime + stopTime;
  }
  
  static format(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) {
      return `${hours} hr`;
    }
    
    return `${hours} hr ${mins} min`;
  }
}

module.exports = ETACalculator;
