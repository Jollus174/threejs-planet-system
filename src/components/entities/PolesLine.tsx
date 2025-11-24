import React, { useRef, useMemo, useEffect } from "react";
import {
  Line,
  BufferGeometry,
  LineDashedMaterial,
  Color,
  Vector3,
} from "three";
import type { BodyData } from "../../types";

interface PolesLineProps {
  data: BodyData;
  visible: boolean;
  diameter: number;
}

const PolesLine: React.FC<PolesLineProps> = ({ data, visible, diameter }) => {
  const lineRef = useRef<Line>(null);

  const geometry = useMemo(() => {
    const polesPoints = [
      new Vector3(0, diameter * 1.15, 0),
      new Vector3(0, diameter * -1.15, 0),
    ];
    return new BufferGeometry().setFromPoints(polesPoints);
  }, [diameter]);

  const color = useMemo(() => new Color(0xffffff), []);

  const material = useMemo(
    () =>
      new LineDashedMaterial({
        color,
        visible,
        scale: 60 / diameter,
        dashSize: 1,
        gapSize: 1,
        transparent: true,
        opacity: 0.3,
      }),
    [color, visible, diameter]
  );

  useEffect(() => {
    if (lineRef.current) {
      lineRef.current.computeLineDistances();
    }
  }, []);

  const lineObject = useMemo(() => {
    const line = new Line(geometry, material);
    line.name = `${data.id} poles line`;
    return line;
  }, [geometry, material, data.id]);

  return <primitive ref={lineRef} object={lineObject} />;
};

export default PolesLine;
