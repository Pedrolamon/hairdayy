import React, { useEffect } from 'react';
import { useUnit } from '../context/UnitContext';

const UnitSelector: React.FC = () => {
  const { unit, setUnit, units, fetchUnits } = useUnit();

  useEffect(() => { fetchUnits(); }, []);

  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-sm">Unidade:</span>
      <select
        value={unit?.id || ''}
        onChange={e => {
          const selected = units.find(u => u.id === Number(e.target.value));
          setUnit(selected || null);
        }}
        className="border p-1 rounded"
      >
        <option value="">Selecione...</option>
        {units.map(u => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>
      {unit && <span className="text-xs text-gray-500">{unit.address}</span>}
    </div>
  );
};

export default UnitSelector; 