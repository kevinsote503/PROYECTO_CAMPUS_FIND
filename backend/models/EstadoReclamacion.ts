import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/database';

export interface EstadoReclamacionAttributes {
  id?: number;
  nombre: string;
}

export class EstadoReclamacion extends Model<EstadoReclamacionAttributes> implements EstadoReclamacionAttributes {
  declare public id: number;
  declare public nombre: string;
}

EstadoReclamacion.init(
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
    tableName: 'estados_reclamacion',
    timestamps: false,
  }
);

export default EstadoReclamacion;
