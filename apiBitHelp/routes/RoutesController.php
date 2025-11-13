<?php
class RoutesController
{
    public function index()
    {
        if (isset($_SERVER['REQUEST_URI']) && !empty($_SERVER['REQUEST_URI'])) {
            //Gestion de imagenes
            if (strpos($_SERVER['REQUEST_URI'], '/uploads/') === 0) {
                $filePath = __DIR__ . $_SERVER['REQUEST_URI'];
                
                if (file_exists($filePath)) {
                    header('Content-Type: ' . mime_content_type($filePath));
                    readfile($filePath);
                    exit;
                } else {
                    http_response_code(404);
                    echo 'Archivo no encontrado.';
                }
            }
             
            //Solicitud preflight
            if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
                http_response_code(200);
                exit();
            }
            
            $routesArray = explode("/", $_SERVER['REQUEST_URI']);
            $routesArray = array_filter($routesArray);

            if (count($routesArray) < 2) {
                $json = array(
                    'status' => 404,
                    'result' => 'Controlador no especificado'
                );
                echo json_encode($json, http_response_code($json["status"]));
                return;
            }

            if (isset($_SERVER['REQUEST_METHOD'])) {
                $controller = $routesArray[3] ?? null;
                $action = $routesArray[4] ?? null;
                $param1 = $routesArray[5] ?? null;
                $param2 = $routesArray[6] ?? null;
                
                if ($controller) {
                    try {
                        if (class_exists($controller)) {
                            $response = new $controller();
                            
                            switch ($_SERVER['REQUEST_METHOD']) {
                                case 'GET':
                                    if ($param1 && $param2) {
                                        $response->$action($param1, $param2);
                                    } elseif ($action && is_numeric($action) && method_exists($controller, 'get')) {
                                        // Si action es numérico y existe método get, es un ID
                                        $response->get($action);
                                    }elseif ($action === 'byUser' && $param1 && method_exists($controller, 'getByUserId')) {
                                        $response->getByUserId($param1); // <<-- ¡El método correcto!
                                    }elseif ($param1 && isset($action)) {
                                        $response->$action($param1);
                                    } elseif ($action && method_exists($controller, $action)) {
                                        // Es una acción válida (como getSpecialties)
                                        $response->$action();
                                    } elseif (!isset($action)) {
                                        $response->index();
                                    } else {
                                        $json = array(
                                            'status' => 404,
                                            'result' => 'Acción no encontrada'
                                        );
                                        echo json_encode($json, http_response_code($json["status"]));
                                    }
                                    break;

                                case 'POST':
                                    if ($action && method_exists($controller, $action)) {
                                        $response->$action();
                                    } else {
                                        $response->create();
                                    }
                                    break;

                                case 'PUT':
                                case 'PATCH':

                                    if ($param1 === 'password' && is_numeric($action) && method_exists($controller, 'updatePassword')) {                                           
                                            $response->updatePassword($action);
                                            break; 
                                    }
                                    if ($action && is_numeric($action) && method_exists($controller, 'update')) {
                                        // Si action es numérico y existe método update, es un ID
                                        $response->update($action);
                                    } elseif ($param1) {
                                        $response->update($param1);
                                    } elseif ($action && method_exists($controller, $action)) {
                                        $response->$action();
                                    } else {
                                        $response->update();
                                    }
                                    break;

                                case 'DELETE':
                                    if ($action && is_numeric($action) && method_exists($controller, 'delete')) {
                                        // Si action es numérico y existe método delete, es un ID
                                        $response->delete($action);
                                    } elseif ($param1) {
                                        $response->delete($param1);
                                    } elseif ($action && method_exists($controller, $action)) {
                                        $response->$action();
                                    } else {
                                        $response->delete();
                                    }
                                    break;

                                default:
                                    $json = array(
                                        'status' => 405,
                                        'result' => 'Método HTTP no permitido'
                                    );
                                    echo json_encode($json, http_response_code($json["status"]));
                                    break;
                            }
                        } else {
                            $json = array(
                                'status' => 404,
                                'result' => 'Controlador no encontrado'
                            );
                            echo json_encode($json, http_response_code($json["status"]));
                        }
                    } catch (\Throwable $th) {
                        $json = array(
                            'status' => 404,
                            'result' => $th->getMessage()
                        );
                        echo json_encode($json, http_response_code($json["status"]));
                        handleException($th);
                    }
                } else {
                    $json = array(
                        'status' => 404,
                        'result' => 'Controlador o acción no especificados'
                    );
                    echo json_encode($json, http_response_code($json["status"]));
                }
            }
        }
    }
}