// validationSchemas.js
import * as yup from 'yup';

const phoneRegExp = /^\d{8,15}$/;
const isEditing = (ref, value) => {
    // Si estamos en modo edición (la prop 'userToEdit' existe)
    // la contraseña es opcional si el campo está vacío.
    return ref.options.context?.isEditing && !value;
};

export const userSchema = yup.object().shape({
    // Obligatorios y longitud mínima de 2
    nombre: yup.string().required("El nombre es obligatorio.").min(2, "Mínimo 2 caracteres."),
    primerApellido: yup.string().required("El primer apellido es obligatorio.").min(2, "Mínimo 2 caracteres."),
    segundoApellido: yup.string().nullable(),

    // Correo: requerido y con formato de email
    correo: yup.string().email("El formato del correo electrónico no es válido.").required("El correo es obligatorio."),
    
    // Teléfono: opcional, pero si existe debe cumplir el formato
    telefono: yup.string().nullable().matches(phoneRegExp, "El teléfono debe contener solo números (8 a 15 dígitos) o estar vacío.").optional(),
    
    // Rol: Requerido (asumimos que el select siempre tendrá un valor por defecto)
    idRol: yup.string().required("Debe seleccionar un Rol."),

    estado: yup.number() // Se debe validar como número
    .when('$isEditing', {
        is: true,
        // En edición es requerido y solo acepta 1 o 0
        then: (schema) => schema
            .required("El estado es obligatorio en edición.")
            .oneOf([1, 0], 'El estado debe ser Activo (1) o Inactivo (0).'),
        // En creación es opcional/ignorado
        otherwise: (schema) => schema.optional(),
    }),

    // Contraseña:
    contrasenna: yup
            .string()
            .nullable() 
            .test('min-length-if-present', 'La contraseña debe tener al menos 6 caracteres.', function(value) {
                // Si el valor es null, undefined o cadena vacía, pasa la prueba.
                if (!value) return true; 
                // Si hay un valor, aplica la validación de longitud.
                return value.length >= 6;
            })
            .when('$isEditing', {
                is: false, 
                // Crear: Requerida (y ahora .min(6) aplica porque value no será vacío)
                then: (schema) => schema.required('La contraseña es obligatoria para nuevos usuarios.'), 
                
                // Editar: Es opcional y no requerida.
                otherwise: (schema) => schema.notRequired(), 
            }),
});