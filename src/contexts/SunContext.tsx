import React, { createContext, useContext, useState, ReactNode } from "react";
import { Mesh } from "three";

interface SunContextValue {
  sunMesh: Mesh | null;
  setSunMesh: (mesh: Mesh | null) => void;
}

const SunContext = createContext<SunContextValue | null>(null);

export const useSun = () => {
  const context = useContext(SunContext);
  if (!context) {
    throw new Error("useSun must be used within a SunProvider");
  }
  return context;
};

interface SunProviderProps {
  children: ReactNode;
}

export const SunProvider: React.FC<SunProviderProps> = ({ children }) => {
  const [sunMesh, setSunMesh] = useState<Mesh | null>(null);

  return (
    <SunContext.Provider value={{ sunMesh, setSunMesh }}>
      {children}
    </SunContext.Provider>
  );
};
