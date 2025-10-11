import express from 'express';
import { deleteUser, getAllUsers, getMyPoints, getUserById, loginUser, saveUser, updateUser } from '../controller/userController.js';

const userRouter = express.Router();

userRouter.post('/register', saveUser);
userRouter.post('/login',loginUser);
userRouter.get('/getUser',getUserById);
userRouter.get('/',getAllUsers);
userRouter.put('/:userId',updateUser);
userRouter.delete('/:userId', deleteUser);
userRouter.get('/points',getMyPoints)

export default userRouter;