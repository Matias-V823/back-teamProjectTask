import { Router } from 'express'
import { body, param } from 'express-validator'
import { ProjectController } from '../controllers/ProjectController';
import { handleInputErrors } from '../middleware/validation';
import { TaskController } from '../controllers/TaskController';
import { projectExists } from '../middleware/project';
import { taskBelongsToProject, taskExists } from '../middleware/task';
import { authenticate } from '../middleware/auth';
import { TeamMemberController } from '../controllers/TeamController';
import { ProductBacklogController } from '../controllers/ProductBacklogController';
import { onlyManager } from '../middleware/onlyManager'
import { SprintBacklogController } from '../controllers/SprintBacklogController'

const router = Router();

router.use(authenticate)

router.post('/',
    body('projectName').notEmpty().withMessage('El nombre del proyecto es obligatorio'),
    body('clientName').notEmpty().withMessage('El nombre del cliente es obligatorio'),
    body('description').notEmpty().withMessage('La descripcion del proyecto es obligatoria'),
    handleInputErrors,
    ProjectController.createProject
)

router.get('/',
    ProjectController.getAllProjects)

// Metrics
router.get('/metrics', ProjectController.metrics)

router.get('/:id',
    param('id').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    ProjectController.getProjectById
)

router.get('/:projectId/metrics',
    param('projectId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    projectExists,
    ProjectController.perProjectMetrics
)

router.put('/:id',
    param('id').isMongoId().withMessage('ID no válido'),
    body('projectName').notEmpty().withMessage('El nombre del proyecto es obligatorio'),
    body('clientName').notEmpty().withMessage('El nombre del cliente es obligatorio'),
    body('description').notEmpty().withMessage('La descripcion del proyecto es obligatoria'),
    handleInputErrors,
    ProjectController.updateProject
)
router.delete('/:id',
    param('id').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    ProjectController.deleteProject
)


/* Routes for tasks */
router.param('projectId', projectExists)


router.post('/:projectId/tasks',
    body('name').notEmpty().withMessage('El nombre de la tarea es obligatorio'),
    body('description').notEmpty().withMessage('El nombre de la descripcion es obligatoria'),
    body('assignedTo').optional({ values: 'falsy' }).isMongoId().withMessage('assignedTo debe ser un ID válido'),
    TaskController.createTask
)

router.get('/:projectId/tasks',
    TaskController.getTasks
)


router.param('taskId', taskExists)
router.param('taskId', taskBelongsToProject)

router.get('/:projectId/tasks/:taskId',
    param('taskId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    TaskController.getTasksById
)
router.put('/:projectId/tasks/:taskId',
    param('taskId').isMongoId().withMessage('ID no válido'),
    body('name').notEmpty().withMessage('El nombre de la tarea es obligatorio'),
    body('description').notEmpty().withMessage('El nombre de la descripcion es obligatoria'),
    body('assignedTo').optional({ values: 'falsy' }).isMongoId().withMessage('assignedTo debe ser un ID válido'),
    handleInputErrors,
    TaskController.updateTask
)
router.delete('/:projectId/tasks/:taskId',
    param('taskId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    TaskController.deleteTask
)

router.post('/:projectId/tasks/:taskId/status',
    param('taskId').isMongoId().withMessage('ID no válido'),
    body('status').notEmpty().withMessage('El estado es obligatorio'),
    handleInputErrors,
    TaskController.updateStatusTask
)


router.post('/:projectId/team/find',
    body('email').isEmail().withMessage('E-mail no válido'),
    handleInputErrors,
    TeamMemberController.findMemberByEmail
)

router.post('/:projectId/team',
    body('id').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    TeamMemberController.addMemberById
)

router.delete('/:projectId/team/:memberId',
    body('id').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    TeamMemberController.deleteMember
)

router.get('/:projectId/team',
    TeamMemberController.getMembers
)


/* Routes for Product Backlog */
router.get('/:projectId/product-backlog',
    ProductBacklogController.list
)

router.post('/:projectId/product-backlog',
    onlyManager,
    body('persona').notEmpty().withMessage('La persona es obligatoria'),
    body('objetivo').notEmpty().withMessage('El objetivo es obligatorio'),
    body('beneficio').notEmpty().withMessage('El beneficio es obligatorio'),
    handleInputErrors,
    ProductBacklogController.create
)

router.get('/:projectId/product-backlog/:storyId',
    param('storyId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    ProductBacklogController.getOne
)

router.put('/:projectId/product-backlog/:storyId',
    onlyManager,
    param('storyId').isMongoId().withMessage('ID no válido'),
    body('persona').notEmpty().withMessage('La persona es obligatoria'),
    body('objetivo').notEmpty().withMessage('El objetivo es obligatorio'),
    body('beneficio').notEmpty().withMessage('El beneficio es obligatorio'),
    handleInputErrors,
    ProductBacklogController.update
)

router.delete('/:projectId/product-backlog/:storyId',
    onlyManager,
    param('storyId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    ProductBacklogController.remove
)

router.post('/:projectId/product-backlog/reorder',
    onlyManager,
    body('order').isArray({ min: 1 }).withMessage('Order debe ser un arreglo'),
    handleInputErrors,
    ProductBacklogController.reorder
)

/* Routes for Sprint Backlog */
router.get('/:projectId/sprints',
    SprintBacklogController.list
)

router.post('/:projectId/sprints',
    onlyManager,
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('startDate').notEmpty().withMessage('startDate es obligatorio').isISO8601().withMessage('Fecha inválida'),
    body('endDate').notEmpty().withMessage('endDate es obligatorio').isISO8601().withMessage('Fecha inválida'),
    handleInputErrors,
    SprintBacklogController.create
)

router.get('/:projectId/sprints/:sprintId',
    param('sprintId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    SprintBacklogController.getOne
)

router.put('/:projectId/sprints/:sprintId',
    onlyManager,
    param('sprintId').isMongoId().withMessage('ID no válido'),
    body('name').optional().isString(),
    body('startDate').optional().isISO8601().withMessage('Fecha inválida'),
    body('endDate').optional().isISO8601().withMessage('Fecha inválida'),
    body('status').optional().isIn(['planned','active','completed','cancelled']).withMessage('Status inválido'),
    handleInputErrors,
    SprintBacklogController.update
)

router.put('/:projectId/sprints/:sprintId/stories',
    onlyManager,
    param('sprintId').isMongoId().withMessage('ID no válido'),
    body('stories').isArray().withMessage('stories debe ser un arreglo'),
    handleInputErrors,
    SprintBacklogController.updateStories
)

router.get('/:projectId/sprints/:sprintId/stories',
    param('sprintId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    SprintBacklogController.getStories
)

router.delete('/:projectId/sprints/:sprintId',
    onlyManager,
    param('sprintId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    SprintBacklogController.remove
)

export default router