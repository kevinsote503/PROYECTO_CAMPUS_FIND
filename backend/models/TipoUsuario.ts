import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/database';

export interface TipoUsuarioAttributes {
  id?: number;
  nombre: string;
}

export class TipoUsuario extends Model<TipoUsuarioAttributes> implements TipoUsuarioAttributes {
  declare public id: number;
  declare public nombre: string;
}

TipoUsuario.init(
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
    tableName: 'tipos_usuario',
    timestamps: false,
  }
);

export default TipoUsuario;
