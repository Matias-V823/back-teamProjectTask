import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { body } from "express-validator";

const router = Router()

router.post('/create-account',
    body('name').notEmpty().withMessage('El nombre no puede ir vacio'),
    body('email').isEmail().withMessage('Email no valido'),
    body('password').isLength({min:8}).withMessage('El password es muy corto, minimo 8 caracteres'),
    body('password_confirmation').custom((value , {req}) =>{
        if(value !== req.body.password){
            throw new Error('Los password no son iguales')
        }
        return true
    }),
    AuthController.createAccount)

export default router