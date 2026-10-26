/**
 * @file seed.ts
 * @description Script para inicializar y precargar la base de datos SQLite con datos sembrados.
 */

import bcrypt from 'bcryptjs';
import {
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
} from '../models';

export async function runSeed(force = false) {
  try {
    console.log('🔄 Sincronizando modelos con la base de datos SQLite...');
    await sequelize.sync({ force });

    // Asegurar columnas de geolocalización (latitud, longitud) en bases de datos preexistentes
    const migracionesGeo = [
      'ALTER TABLE ubicaciones ADD COLUMN latitud FLOAT DEFAULT 13.3468;',
      'ALTER TABLE ubicaciones ADD COLUMN longitud FLOAT DEFAULT -88.4205;',
      'ALTER TABLE objetos ADD COLUMN latitud FLOAT;',
      'ALTER TABLE objetos ADD COLUMN longitud FLOAT;',
    ];
    for (const sql of migracionesGeo) {
      try {
        await sequelize.query(sql);
      } catch {
        // La columna ya existe
      }
    }

    // Coordenadas reales del Campus Universitario en Usulután (UGB Usulután y alrededores de la ciudad)
    const coordenadasUsulutan: Record<number, { latitud: number; longitud: number; edificio: string; nombre: string; descripcion: string }> = {
      1: {
        nombre: 'Biblioteca Central - Sala de Estudio',
        edificio: 'Edificio B (Campus Usulután)',
        descripcion: 'Segundo piso, cubículos de lectura y sala de consulta digital en Campus Usulután',
        latitud: 13.3468,
        longitud: -88.4205,
      },
      2: {
        nombre: 'Cafetería Principal Universitaria',
        edificio: 'Edificio C (Campus Usulután)',
        descripcion: 'Área de mesas techadas y zona de alimentos del Campus Usulután',
        latitud: 13.3462,
        longitud: -88.4212,
      },
      3: {
        nombre: 'Laboratorio de Cómputo 102',
        edificio: 'Facultad de Ingeniería (Usulután)',
        descripcion: 'Primer nivel, ala norte de sistemas e informática en Usulután',
        latitud: 13.3473,
        longitud: -88.4198,
      },
      4: {
        nombre: 'Cancha y Complejo Polideportivo',
        edificio: 'Área Deportiva Usulután',
        descripcion: 'Gradas principales y cancha multiusos del campus en Usulután',
        latitud: 13.3456,
        longitud: -88.4220,
      },
      5: {
        nombre: 'Auditorio Mayor y Rectoría',
        edificio: 'Edificio Administrativo (Usulután)',
        descripcion: 'Salón de actos, atención estudiantil y vigilancia central en Usulután',
        latitud: 13.3470,
        longitud: -88.4215,
      },
      6: {
        nombre: 'Plaza Central Estudiantil / Parque Usulután',
        edificio: 'Zona Central Usulután',
        descripcion: 'Área verde, bancas estudiantiles y parada de transporte hacia el centro de Usulután',
        latitud: 13.3446,
        longitud: -88.4368,
      },
      7: {
        nombre: 'Edificio de Aulas A3 - Salón 304',
        edificio: 'Edificio A3 (Campus Usulután)',
        descripcion: 'Tercer nivel, aulas de ciencias económicas e ingeniería en Usulután',
        latitud: 13.3465,
        longitud: -88.4195,
      },
    };

    // 1. Tipos de usuario
    const countTipos = await TipoUsuario.count();
    if (countTipos === 0) {
      console.log('🌱 Sembrando tipos de usuario...');
      await TipoUsuario.bulkCreate([
        { id: 1, nombre: 'estudiante' },
        { id: 2, nombre: 'docente' },
        { id: 3, nombre: 'personal' },
        { id: 4, nombre: 'administrador' },
      ]);
    }

    // 2. Categorías
    const countCategorias = await Categoria.count();
    if (countCategorias === 0) {
      console.log('🌱 Sembrando categorías...');
      await Categoria.bulkCreate([
        { id: 1, nombre: 'Electrónica' },
        { id: 2, nombre: 'Documentos e Identificaciones' },
        { id: 3, nombre: 'Mochilas y Bolsos' },
        { id: 4, nombre: 'Ropa y Accesorios' },
        { id: 5, nombre: 'Libros y Cuadernos' },
        { id: 6, nombre: 'Llaves y Llaveros' },
        { id: 7, nombre: 'Botellas y Termos' },
        { id: 8, nombre: 'Otros' },
      ]);
    }

    // 3. Ubicaciones
    const countUbicaciones = await Ubicacion.count();
    if (countUbicaciones === 0) {
      console.log('🌱 Sembrando ubicaciones geolocalizadas de Usulután...');
      await Ubicacion.bulkCreate(
        Object.entries(coordenadasUsulutan).map(([id, data]) => ({
          id: Number(id),
          ...data,
        }))
      );
    } else {
      // Actualizar coordenadas de Usulután en ubicaciones existentes
      for (const [idStr, coords] of Object.entries(coordenadasUsulutan)) {
        await Ubicacion.update(
          {
            latitud: coords.latitud,
            longitud: coords.longitud,
            edificio: coords.edificio,
            descripcion: coords.descripcion,
          },
          { where: { id: Number(idStr) } }
        );
      }
    }

    // 4. Estados de objetos
    const countEstados = await Estado.count();
    if (countEstados === 0) {
      console.log('🌱 Sembrando estados de objetos...');
      await Estado.bulkCreate([
        { id: 1, nombre: 'perdido' },
        { id: 2, nombre: 'encontrado' },
        { id: 3, nombre: 'recuperado' },
      ]);
    }

    // 5. Estados de reclamación
    const countEstadosRec = await EstadoReclamacion.count();
    if (countEstadosRec === 0) {
      console.log('🌱 Sembrando estados de reclamación...');
      await EstadoReclamacion.bulkCreate([
        { id: 1, nombre: 'pendiente' },
        { id: 2, nombre: 'aprobada' },
        { id: 3, nombre: 'rechazada' },
      ]);
    }

    // 6. Usuarios semilla
    const countUsuarios = await Usuario.count();
    if (countUsuarios === 0) {
      console.log('🌱 Sembrando usuarios de prueba con contraseñas seguras...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      await Usuario.bulkCreate([
        {
          id: 1,
          nombre: 'Coordinador de Seguridad y Hallazgos',
          correo: 'admin@campusfind.edu',
          contraseña: hashedPassword,
          telefono: '555-0100',
          tipo_usuario_id: 4, // administrador
        },
        {
          id: 2,
          nombre: 'Valeria Morales',
          correo: 'estudiante@campusfind.edu',
          contraseña: hashedPassword,
          telefono: '555-0101',
          tipo_usuario_id: 1, // estudiante
        },
        {
          id: 3,
          nombre: 'Prof. Carlos Méndez',
          correo: 'docente@campusfind.edu',
          contraseña: hashedPassword,
          telefono: '555-0102',
          tipo_usuario_id: 2, // docente
        },
        {
          id: 4,
          nombre: 'Marta Gómez (Vigilancia)',
          correo: 'personal@campusfind.edu',
          contraseña: hashedPassword,
          telefono: '555-0103',
          tipo_usuario_id: 3, // personal
        },
      ]);
    }

    // 7. Objetos de prueba
    const countObjetos = await Objeto.count();
    if (countObjetos === 0) {
      console.log('🌱 Sembrando objetos perdidos y encontrados...');
      const now = new Date();
      const hace2Dias = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const hace1Dia = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const hace3Dias = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const hace4Horas = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const hace5Dias = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      await Objeto.bulkCreate([
        {
          id: 1,
          usuario_id: 2, // Valeria
          categoria_id: 1, // Electrónica
          ubicacion_id: 1, // Biblioteca Central
          estado_id: 1, // perdido
          titulo: 'Calculadora Texas Instruments TI-84 Plus',
          descripcion: 'Calculadora gráfica color negro con funda protectora gris clara. Tiene una calcomanía de fórmula física en la tapa trasera.',
          fecha_reporte: hace2Dias,
          latitud: 13.3469,
          longitud: -88.4204,
        },
        {
          id: 2,
          usuario_id: 4, // Marta (Personal)
          categoria_id: 1, // Electrónica
          ubicacion_id: 3, // Lab Computo 102
          estado_id: 2, // encontrado
          titulo: 'Auriculares Inalámbricos Sony WH-CH520',
          descripcion: 'Auriculares de diadema color azul marino, encontrados sobre el escritorio de la terminal de cómputo número 12.',
          fecha_reporte: hace1Dia,
          latitud: 13.3474,
          longitud: -88.4197,
        },
        {
          id: 3,
          usuario_id: 2, // Valeria
          categoria_id: 2, // Documentos
          ubicacion_id: 2, // Cafetería Principal
          estado_id: 1, // perdido
          titulo: 'Credencial Universitaria y Tarjeta de Transporte',
          descripcion: 'Portacredencial de acrílico con cinta azul que dice Facultad de Ciencias. A nombre de Valeria M.',
          fecha_reporte: hace3Dias,
          latitud: 13.3461,
          longitud: -88.4213,
        },
        {
          id: 4,
          usuario_id: 3, // Prof. Carlos
          categoria_id: 3, // Mochilas
          ubicacion_id: 7, // Aulas 3 Salón 304
          estado_id: 2, // encontrado
          titulo: 'Mochila Jansport Color Verde Oliva',
          descripcion: 'Contiene libreta de apuntes de Cálculo Vectorial y una cartuchera negra con bolígrafos y lápices.',
          fecha_reporte: hace4Horas,
          latitud: 13.3466,
          longitud: -88.4194,
        },
        {
          id: 5,
          usuario_id: 4, // Marta
          categoria_id: 6, // Llaves
          ubicacion_id: 6, // Plaza Central
          estado_id: 2, // encontrado
          titulo: 'Llavero con 3 llaves y figura metálica de búho',
          descripcion: 'Llavero metálico hallado en una de las bancas cercanas a la parada estudiantil en Usulután.',
          fecha_reporte: hace1Dia,
          latitud: 13.3446,
          longitud: -88.4368,
        },
        {
          id: 6,
          usuario_id: 2, // Valeria
          categoria_id: 7, // Botellas y Termos
          ubicacion_id: 4, // Gimnasio
          estado_id: 3, // recuperado
          titulo: 'Termo Hydro Flask 32oz Azul Cielo',
          descripcion: 'Termo de acero inoxidable con calcomanía de la mascota universitaria en la parte frontal.',
          fecha_reporte: hace5Dias,
          latitud: 13.3457,
          longitud: -88.4219,
        },
      ]);
    } else {
      // Asegurar que objetos existentes tengan coordenadas de su ubicación en Usulután
      const objetosSinGeo = await Objeto.findAll();
      for (const obj of objetosSinGeo) {
        if (!obj.latitud || !obj.longitud) {
          const baseCoord = coordenadasUsulutan[obj.ubicacion_id] || coordenadasUsulutan[1];
          // Ligera variación para que no se encimen exactamente en el mismo píxel
          const offsetLat = ((obj.id % 5) - 2) * 0.00012;
          const offsetLng = ((obj.id % 3) - 1) * 0.00012;
          await Objeto.update(
            {
              latitud: Number((baseCoord.latitud + offsetLat).toFixed(6)),
              longitud: Number((baseCoord.longitud + offsetLng).toFixed(6)),
            },
            { where: { id: obj.id } }
          );
        }
      }
    }

    // 8. Reclamaciones
    const countReclamaciones = await Reclamacion.count();
    if (countReclamaciones === 0) {
      console.log('🌱 Sembrando solicitudes de reclamación...');
      const now = new Date();
      const hace18Horas = new Date(now.getTime() - 18 * 60 * 60 * 1000);
      const hace4Dias = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

      await Reclamacion.bulkCreate([
        {
          id: 1,
          objeto_id: 2, // Auriculares Sony
          usuario_id: 2, // Valeria
          descripcion: 'Creo que los auriculares son míos. Son marca Sony modelo azul marino, tienen una pequeña raspadura en el auricular izquierdo y la almohadilla derecha está ligeramente desgastada.',
          fecha: hace18Horas,
          estado_reclamacion_id: 1, // pendiente
        },
        {
          id: 2,
          objeto_id: 6, // Termo recuperado
          usuario_id: 2, // Valeria
          descripcion: 'El termo tiene mis iniciales VM en la base con marcador permanente y la calcomanía del búho deportivo.',
          fecha: hace4Dias,
          estado_reclamacion_id: 2, // aprobada
        },
      ]);
    }

    // 9. Entregas
    const countEntregas = await Entrega.count();
    if (countEntregas === 0) {
      console.log('🌱 Sembrando entregas registradas...');
      const hace3Dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      await Entrega.bulkCreate([
        {
          id: 1,
          reclamacion_id: 2,
          fecha: hace3Dias,
          observaciones: 'Entrega formal realizada en caseta de seguridad central previa verificación de identidad con credencial universitaria.',
        },
      ]);
    }

    console.log('✅ Base de datos SQLite inicializada y sembrada con éxito.');
  } catch (error) {
    console.error('❌ Error al sembrar la base de datos:', error);
    throw error;
  }
}

// Ejecución directa si se invoca desde CLI: node / tsx seed.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export default runSeed;
