import { DataTypes } from 'sequelize';
import sequelize from '../database/database';
import { EntidadBase, ResultadoValidacionPOO } from './EntidadBase';

export interface CategoriaAttributes {
  id?: number;
  nombre: string;
}

export class Categoria extends EntidadBase<CategoriaAttributes> implements CategoriaAttributes {
  declare public id: number;
  declare public nombre: string;

  public obtenerResumenPOO(): string {
    return `Categoría #${this.id}: ${this.nombre}`;
  }

  public validarDominio(): ResultadoValidacionPOO {
    const errores: string[] = [];
    if (!this.nombre || this.nombre.trim().length < 3 || this.nombre.trim().length > 50) {
      errores.push('El nombre de la categoría debe tener entre 3 y 50 caracteres.');
    }
    return { valido: errores.length === 0, errores };
  }
}

Categoria.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: 'categorias',
    timestamps: false,
  }
);

export default Categoria;
