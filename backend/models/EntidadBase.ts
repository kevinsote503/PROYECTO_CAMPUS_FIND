/**
 * @file EntidadBase.ts
 * @description Clase abstracta base para aplicar principios de Programación Orientada a Objetos (POO):
 *              Herencia, Polimorfismo y Encapsulamiento sobre los modelos relacionales de Sequelize.
 */

import { Model } from 'sequelize';

export interface ResultadoValidacionPOO {
  valido: boolean;
  errores: string[];
}

/**
 * Clase abstracta EntidadBase<TModelAttributes, TCreationAttributes>
 * Todas las entidades principales del sistema heredan de esta clase base.
 */
export abstract class EntidadBase<
  TModelAttributes extends {} = any,
  TCreationAttributes extends {} = TModelAttributes
> extends Model<TModelAttributes, TCreationAttributes> {
  declare public id: number;

  /**
   * Método polimórfico que cada clase hija implementa para describir su instancia.
   */
  public abstract obtenerResumenPOO(): string;

  /**
   * Método polimórfico que valida las reglas de negocio y formato de los atributos de la entidad.
   */
  public abstract validarDominio(): ResultadoValidacionPOO;

  /**
   * Método común heredado que retorna metadatos de la entidad POO.
   */
  public obtenerMetadatosPOO() {
    return {
      clase: this.constructor.name,
      id: this.id,
      resumen: this.obtenerResumenPOO(),
      validacion: this.validarDominio(),
    };
  }
}

export default EntidadBase;
