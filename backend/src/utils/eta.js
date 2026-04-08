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
  
  static calculateFromSpeed(distanceKm, avgSpeedKmh) {
    if (avgSpeedKmh <= 0) return 0;
    
    const travelTimeHours = distanceKm / avgSpeedKmh;
    return Math.round(travelTimeHours * 60);
  }
  
  static estimateWithTraffic(distanceKm, baseTraffic = 'moderate', timeOfDay = null) {
    let trafficCondition = baseTraffic;
    
    if (timeOfDay) {
      const hour = new Date(timeOfDay).getHours();
      if (hour >= 7 && hour <= 9) {
        trafficCondition = 'peak';
      } else if (hour >= 16 && hour <= 18) {
        trafficCondition = 'peak';
      } else if (hour >= 10 && hour <= 15) {
        trafficCondition = 'moderate';
      } else {
        trafficCondition = 'light';
      }
    }
    
    return this.calculate(distanceKm, trafficCondition);
  }
}

module.exports = ETACalculator;
