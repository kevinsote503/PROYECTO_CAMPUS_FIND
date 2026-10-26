/**
 * @file index.ts
 * @description Definición y exportación de asociaciones relacionales 3FN entre modelos Sequelize.
 */

import sequelize from '../database/database';
import TipoUsuario from './TipoUsuario';
import Usuario from './Usuario';
import Categoria from './Categoria';
import Ubicacion from './Ubicacion';
import Estado from './Estado';
import EstadoReclamacion from './EstadoReclamacion';
import Objeto from './Objeto';
import Reclamacion from './Reclamacion';
import Entrega from './Entrega';

// Relaciones: Tipos de Usuario <-> Usuarios
TipoUsuario.hasMany(Usuario, { foreignKey: 'tipo_usuario_id', as: 'usuarios' });
Usuario.belongsTo(TipoUsuario, { foreignKey: 'tipo_usuario_id', as: 'tipo_usuario' });

// Relaciones: Usuarios <-> Objetos
Usuario.hasMany(Objeto, { foreignKey: 'usuario_id', as: 'objetos' });
Objeto.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Relaciones: Categorías <-> Objetos
Categoria.hasMany(Objeto, { foreignKey: 'categoria_id', as: 'objetos' });
Objeto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });

// Relaciones: Ubicaciones <-> Objetos
Ubicacion.hasMany(Objeto, { foreignKey: 'ubicacion_id', as: 'objetos' });
Objeto.belongsTo(Ubicacion, { foreignKey: 'ubicacion_id', as: 'ubicacion' });

// Relaciones: Estados <-> Objetos
Estado.hasMany(Objeto, { foreignKey: 'estado_id', as: 'objetos' });
Objeto.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });

// Relaciones: Objetos <-> Reclamaciones
Objeto.hasMany(Reclamacion, { foreignKey: 'objeto_id', as: 'reclamaciones' });
Reclamacion.belongsTo(Objeto, { foreignKey: 'objeto_id', as: 'objeto' });

// Relaciones: Usuarios <-> Reclamaciones
Usuario.hasMany(Reclamacion, { foreignKey: 'usuario_id', as: 'reclamaciones' });
Reclamacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Relaciones: EstadosReclamacion <-> Reclamaciones
EstadoReclamacion.hasMany(Reclamacion, { foreignKey: 'estado_reclamacion_id', as: 'reclamaciones' });
Reclamacion.belongsTo(EstadoReclamacion, { foreignKey: 'estado_reclamacion_id', as: 'estado_reclamacion' });

// Relaciones: Reclamaciones <-> Entregas (1 a 1)
Reclamacion.hasOne(Entrega, { foreignKey: 'reclamacion_id', as: 'entrega' });
Entrega.belongsTo(Reclamacion, { foreignKey: 'reclamacion_id', as: 'reclamacion' });

export {
  sequelize,
  TipoUsuario,
  Usuario,
  Categoria,
  Ubicacion,
  Estado,
  EstadoReclamacion,
  Objeto,
  Reclamacion,
  Entrega,
};

export default {
  sequelize,
  TipoUsuario,
  Usuario,
  Categoria,
  Ubicacion,
  Estado,
  EstadoReclamacion,
  Objeto,
  Reclamacion,
  Entrega,
};
