import express, { Router } from 'express'
import { authMiddleware } from '../auth/auth.middleware.js'
import { deleteCart ,deleteSingelItemCart ,getCart ,addItemsToCart ,updateSingleItemInCart, syncCart } from './cart.controller.js'
import {validate } from '../../utils/validate.js'
import {postCartSchema,syncCartSchema} from './cart.schemas.js'
const cartRoutes: Router = express.Router()

cartRoutes.get('/',authMiddleware,getCart)

cartRoutes.post('/',authMiddleware,validate(postCartSchema),addItemsToCart)

cartRoutes.put('/:productId',authMiddleware,updateSingleItemInCart)

cartRoutes.delete('/:productId',authMiddleware,deleteSingelItemCart)

cartRoutes.delete('/',authMiddleware,deleteCart)

cartRoutes.post('/sync',authMiddleware,validate(syncCartSchema),syncCart)


export default cartRoutes