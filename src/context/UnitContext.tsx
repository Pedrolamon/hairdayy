import React, { createContext, useContext, useState, useEffect } from 'react';

interface Unit {
  id: number;
  name: string;
  address?: string;
  phone?: string;
}

interface UnitContextType {
  unit: Unit | null;
  setUnit: (unit: Unit | null) => void;
  units: Unit[];
  fetchUnits: () => Promise<void>;
}

const UnitContext = createContext<UnitContextType>({} as any);

export const UnitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('selectedUnit');
    if (saved) setUnit(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (unit) localStorage.setItem('selectedUnit', JSON.stringify(unit));
  }, [unit]);

  const fetchUnits = async () => {
    const res = await fetch('/api/units');
    setUnits(await res.json());
  };

  return (
    <UnitContext.Provider value={{ unit, setUnit, units, fetchUnits }}>
      {children}
    </UnitContext.Provider>
  );
};

export const useUnit = () => useContext(UnitContext); 