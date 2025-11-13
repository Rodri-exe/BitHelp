import React, { useEffect } from 'react';
import { Modal, Box, TextField, Button, Typography, Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress } from '@mui/material';
import { useForm, Controller } from 'react-hook-form'; 
import { yupResolver } from '@hookform/resolvers/yup'; 
import { userSchema } from '../../Utilities/validationSchemas'; 
import UserService from '../../services/userService';
import { use } from 'react';
import PropTypes from 'prop-types';



UserFormModal.propTypes = {
    // Estas son las props que recibe tu componente:
    open: PropTypes.bool.isRequired, 
    handleClose: PropTypes.func.isRequired,
    
    userToEdit: PropTypes.shape({
        idUsuario: PropTypes.number,
        nombre: PropTypes.string,
        primerApellido: PropTypes.string,
        segundoApellido: PropTypes.string,
        correo: PropTypes.string,
        telefono: PropTypes.string,
        idRol: PropTypes.number, // o number, dependiendo de cómo lo manejes
        estado: PropTypes.number,
        // ... incluye todas las propiedades que accedes dentro de reset({})
    }), // Si no usas shape, solo usa PropTypes.object, pero shape es mejor
    
};

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 450,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 1,
};

// Valores por defecto para el formulario de RHF
const defaultValues = {
    nombre: '', 
    primerApellido: '', 
    segundoApellido: '', 
    correo: '', 
    contrasenna: '', 
    idRol: '1', 
    telefono: '',
    estado: 1, 
};

export default function UserFormModal({ open, handleClose, userToEdit }) {
    const isEditing = !!userToEdit;
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const { 
        handleSubmit, 
        control, 
        reset, 
        formState: { errors, isSubmitting } // isSubmitting reemplaza el state 'loading' local para el botón
    } = useForm({
        defaultValues,
        resolver: yupResolver(userSchema), // Conexión  al Yup
        context: { isEditing } // Contexto para validación condicional (contraseña)
    });

    // --- Efecto para cargar datos y resetear ---
    useEffect(() => {
        if (open) {
            // 1. Prepara los datos del usuario para RHF
            if (isEditing) {
                reset({
                    nombre: userToEdit.nombre || '',
                    primerApellido: userToEdit.primerApellido || '',
                    segundoApellido: userToEdit.segundoApellido || '',
                    correo: userToEdit.correo || '',
                    telefono: userToEdit.telefono || '',
                    idRol: userToEdit.idRol || '1',
                    contrasenna: '', // Siempre vacío
                    estado: userToEdit.estado || 1,
                });
            } else {
                reset(defaultValues); // Reset a valores por defecto para crear
            }
        }
        setError(null);
    }, [userToEdit, isEditing, open, reset]);


    // --- Lógica de envío (ahora manejada por RHF) ---
    const onSubmit = async (data) => {
        setLoading(true);
        setError(null);

        // 1. Crear el objeto base (contiene strings para idRol y estado)
        let dataToSend = { ...data };

        // Ambas propiedades deben ser números para la API (SQL)
        dataToSend.idRol = Number(dataToSend.idRol);
        
        // El 'estado' solo viene si estamos editando, pero siempre debe ser numérico.
        // Aunque el campo 'estado' esté como string en RHF, lo convertimos a number aquí.
        if (dataToSend.estado !== undefined && dataToSend.estado !== null) {
            dataToSend.estado = Number(dataToSend.estado);
        }


        if (isEditing) {
            // 3. LIMPIEZA DE CONTRASEÑA (CRÍTICO)
            // Elimina 'contrasenna' si viene vacía (como está oculto, siempre estará vacía)
            if (dataToSend.contrasenna === '' || dataToSend.contrasenna === null) {
                delete dataToSend.contrasenna;
            }
            
            // 4. INCLUIR idUsuario (Necesario para el SQL UPDATE)
            dataToSend.idUsuario = userToEdit.idUsuario;
        }

        try {
            let message = '';
            if (isEditing) {
                // Llama al servicio con el ID en la URL y el objeto limpio y convertido
                await UserService.updateUser(userToEdit.idUsuario, dataToSend);
                message = `Usuario ${userToEdit.idUsuario} actualizado correctamente.`;
            } else {
                await UserService.createUser(dataToSend);
                message = `Usuario creado correctamente.`;
            }
            
            handleClose(true, message);
        } catch (err) {
            // Revisa la consola: el error de la API (err.response?.data) te dirá la razón exacta.
            console.error("Error de API:", err.response?.data);
            console.error("Payload enviado:", dataToSend);
            const apiError = err.response?.data?.message || err.response?.data?.error || 'Verifica la conexión o los datos.';
            setError(`Error al guardar: ${apiError}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={() => handleClose(false)}>
            {/* RHF maneja el onSubmit */}
            <Box sx={style} component="form" onSubmit={handleSubmit(onSubmit)}>
                <Typography variant="h5" component="h2" gutterBottom>
                    {isEditing ? ' Editar Usuario' : '➕ Crear Nuevo Usuario'}
                </Typography>
                
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* --- CAMPO NOMBRE --- */}
                <Controller
                    name="nombre"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Nombre"
                            fullWidth
                            required
                            margin="normal"
                            error={!!errors.nombre}
                            helperText={errors.nombre?.message}
                        />
                    )}
                />

                {/* --- CAMPO PRIMER APELLIDO --- */}
                <Controller
                    name="primerApellido"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Primer Apellido"
                            fullWidth
                            required
                            margin="normal"
                            error={!!errors.primerApellido}
                            helperText={errors.primerApellido?.message}
                        />
                    )}
                />
                
                {/* --- CAMPO SEGUNDO APELLIDO --- */}
                <Controller
                    name="segundoApellido"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Segundo Apellido (Opcional)"
                            fullWidth
                            margin="normal"
                            error={!!errors.segundoApellido}
                            helperText={errors.segundoApellido?.message}
                        />
                    )}
                />
                
                {/* --- CAMPO CORREO --- */}
                <Controller
                    name="correo"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Correo Electrónico (Email)"
                            type="email"
                            fullWidth
                            required
                            margin="normal"
                            error={!!errors.correo}
                            helperText={errors.correo?.message}
                        />
                    )}
                />
                
                {/* --- CAMPO TELÉFONO --- */}
                <Controller
                    name="telefono"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Teléfono"
                            fullWidth
                            margin="normal"
                            error={!!errors.telefono}
                            helperText={errors.telefono?.message}
                            // Usamos onChange custom para manejar el valor como null si está vacío
                            onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                            value={field.value || ''}
                        />
                    )}
                />
                
                {/* --- CAMPO CONTRASEÑA --- */}
                {!isEditing && ( // <--- SOLO AL CREAR
                    <Controller
                        name="contrasenna"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Contraseña"
                                type="password"
                                fullWidth
                                required={!isEditing} // Condicionalmente requerido
                                margin="normal"
                                error={!!errors.contrasenna}
                                helperText={errors.contrasenna?.message}
                            />
                        )}
                    />
                )}

                {/* --- CAMPO ESTADO (SELECT, SOLO EDITAR) --- */}
                {isEditing && (
                    <Controller
                        name="estado"
                        control={control}
                        render={({ field }) => (
                            <FormControl fullWidth margin="normal" required error={!!errors.estado}>
                                <InputLabel id="estado-select-label">Estado</InputLabel>
                                <Select
                                    {...field}
                                    labelId="estado-select-label"
                                    id="estado-select"
                                    label="Estado"                                    
                                    value={field.value !== undefined ? field.value : 1}                                    
                                >
                                    <MenuItem value={1}>Activo</MenuItem>
                                    <MenuItem value={0}>Inactivo</MenuItem>
                                </Select>
                                {errors.estado && <Typography color="error" variant="caption" sx={{ml: 2}}>{errors.estado.message}</Typography>}
                            </FormControl>
                        )}
                    />
                )}

                {/* --- CAMPO ROL (SELECT) --- */}
                <Controller
                    name="idRol"
                    control={control}
                    render={({ field }) => (
                        <FormControl fullWidth margin="normal" required error={!!errors.idRol}>
                            <InputLabel id="rol-select-label">Rol</InputLabel>
                            <Select
                                {...field}
                                labelId="rol-select-label"
                                id="rol-select"
                                label="Rol"
                            >
                                <MenuItem value={"1"}>Cliente</MenuItem>
                                <MenuItem value={"2"}>Técnico</MenuItem>
                                <MenuItem value={"3"}>Administrador</MenuItem>
                            </Select>
                            {errors.idRol && <Typography color="error" variant="caption" sx={{ml: 2}}>{errors.idRol.message}</Typography>}
                        </FormControl>
                    )}
                />

                

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                        onClick={() => handleClose(false)} 
                        variant="outlined"
                        disabled={loading || isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        disabled={loading || isSubmitting}
                        startIcon={(loading || isSubmitting) ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isEditing ? 'Actualizar' : 'Guardar'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}