import { useEditorState } from './useEditorState';

export const useTimelineSnap = () => {
  const { snapEnabled, snapTolerance, layers, markers, currentTime } = useEditorState();

  const snapToNearestPoint = (time: number, excludeLayerId?: string): number => {
    if (!snapEnabled) return time;

    const snapPoints: number[] = [];
    
    // Add layer boundaries as snap points
    layers.forEach(layer => {
      if (layer.id !== excludeLayerId) {
        snapPoints.push(layer.start_time);
        snapPoints.push(layer.end_time);
      }
    });
    
    // Add markers as snap points
    markers.forEach(marker => {
      snapPoints.push(marker.time);
    });
    
    // Add playhead as snap point
    snapPoints.push(currentTime);
    
    // Add timeline start
    snapPoints.push(0);

    // Find nearest snap point within tolerance
    const nearest = snapPoints
      .filter(point => Math.abs(point - time) < snapTolerance)
      .reduce((prev, curr) => 
        Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev,
        time
      );

    return Math.abs(nearest - time) < snapTolerance ? nearest : time;
  };

  const getSnapIndicators = (time: number): number[] => {
    if (!snapEnabled) return [];

    const indicators: number[] = [];
    
    layers.forEach(layer => {
      if (Math.abs(layer.start_time - time) < snapTolerance) {
        indicators.push(layer.start_time);
      }
      if (Math.abs(layer.end_time - time) < snapTolerance) {
        indicators.push(layer.end_time);
      }
    });
    
    markers.forEach(marker => {
      if (Math.abs(marker.time - time) < snapTolerance) {
        indicators.push(marker.time);
      }
    });
    
    if (Math.abs(currentTime - time) < snapTolerance) {
      indicators.push(currentTime);
    }

    return [...new Set(indicators)];
  };

  return { 
    snapToNearestPoint, 
    getSnapIndicators 
  };
};
