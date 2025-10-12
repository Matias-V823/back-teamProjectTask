import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { body, param } from 'express-validator'
import { handleInputErrors } from '../middleware/validation'
import { ProfileController } from '../controllers/ProfileController'

const router = Router()

router.use(authenticate)

router.get('/', (req, res) => ProfileController.me(req, res))

router.put('/',
  body('name').optional().isString(),
  body('yearsExperience').optional().isInt({ min: 0 }),
  body('strengths').optional().isArray(),
  handleInputErrors,
  (req, res) => ProfileController.update(req, res)
)

router.post('/technologies',
  body('technology').notEmpty().withMessage('technology es requerido'),
  handleInputErrors,
  (req, res) => ProfileController.addTechnology(req, res)
)

router.delete('/technologies/:technology',
  param('technology').notEmpty().withMessage('technology es requerido'),
  handleInputErrors,
  (req, res) => ProfileController.removeTechnology(req, res)
)

export default router