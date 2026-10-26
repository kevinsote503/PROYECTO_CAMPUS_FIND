import { DataTypes } from 'sequelize';
import sequelize from '../database/database';
import { EntidadBase, ResultadoValidacionPOO } from './EntidadBase';

export interface UbicacionAttributes {
  id?: number;
  nombre: string;
  edificio: string;
  descripcion?: string;
  latitud?: number | null;
  longitud?: number | null;
}

export class Ubicacion extends EntidadBase<UbicacionAttributes> implements UbicacionAttributes {
  declare public id: number;
  declare public nombre: string;
  declare public edificio: string;
  declare public descripcion: string;
  declare public latitud: number | null;
  declare public longitud: number | null;

  public obtenerResumenPOO(): string {
    return `Ubicación #${this.id}: ${this.edificio} - ${this.nombre} (${this.latitud ?? '13.3468'}, ${this.longitud ?? '-88.4205'})`;
  }

  public validarDominio(): ResultadoValidacionPOO {
    const errores: string[] = [];
    if (!this.nombre || this.nombre.trim().length < 3 || this.nombre.trim().length > 100) {
      errores.push('El nombre del espacio o salón debe tener entre 3 y 100 caracteres.');
    }
    if (!this.edificio || this.edificio.trim().length < 2 || this.edificio.trim().length > 50) {
      errores.push('El edificio o facultad debe tener entre 2 y 50 caracteres.');
    }
    return { valido: errores.length === 0, errores };
  }
}

Ubicacion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    edificio: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    latitud: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 13.3468,
    },
    longitud: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: -88.4205,
    },
  },
  {
    sequelize,
    tableName: 'ubicaciones',
    timestamps: false,
  }
);

export default Ubicacion;
